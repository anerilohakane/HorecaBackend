import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import dbConnect from '@/lib/db/connect';
import { logger } from '@/lib/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productName, currentStock, minThreshold } = body;

    await logger({
      action: "read",
      message: `Generated inventory forecast for ${productName || productId}`,
      metadata: { entity: "Inventory", productId, productName },
      req: request
    });

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Attempt to gather "Live Data" for velocity
    let salesVelocity = 0; // units per day
    try {
      // In HorecaBackend, we can use the Order model directly instead of fetching from itself
      const Order = (await import("@/lib/db/models/order")).default;
      const allOrders = await Order.find({}).lean();
      
      // Filter orders for this product in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const relevantOrders = allOrders.filter(o => 
        new Date(o.createdAt || o.date) > thirtyDaysAgo && 
        o.items?.some(item => String(item.productId) === String(productId) || item.name === productName)
      );

      const totalSold = relevantOrders.reduce((sum, o) => {
        const item = o.items.find(i => String(i.productId) === String(productId) || i.name === productName);
        return sum + (item?.quantity || 0);
      }, 0);

      salesVelocity = totalSold / 30;
    } catch (e) {
      console.error("Order analysis error for forecasting:", e.message);
    }

    // Fallback/Simulated Velocity if no real data found
    if (salesVelocity === 0) {
      salesVelocity = (minThreshold || 5) / 7; 
    }

    // 2. Calculate 30-day forecast
    const forecast = [];
    let projectedStock = currentStock;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dailyVariation = 1 + (Math.random() * 0.4 - 0.2); 
        const seasonality = 1 + (Math.sin(i / 5) * 0.1); 
        const consumption = salesVelocity * dailyVariation * seasonality;
        
        projectedStock = Math.max(0, projectedStock - consumption);
        
        forecast.push({
            date: date.toISOString().split('T')[0],
            projectedStock: Number(projectedStock.toFixed(1)),
            demand: Number(consumption.toFixed(1))
        });
    }

    // 3. ChainPilot Strategic Analysis (LLM)
    const apiKey = process.env.GEMINI_API_KEY;
    let aiRecommendation = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `You are ChainPilot, an AI SCM Optimization bot.
Analyze this inventory data for "${productName}":
- Current Stock: ${currentStock}
- Minimum Safety Threshold: ${minThreshold}
- Current Sales Velocity: ${salesVelocity.toFixed(2)} units/day
- Projected Stock-out: ${projectedStock === 0 ? 'Within 30 days' : 'Stable'}

Return a 2-sentence strategic recommendation. Include a specific suggested reorder quantity and a "Urgency Level" (Low, Medium, High). 
Format: Just the recommendation text.`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        aiRecommendation = response.text;
      } catch (err) {
        console.error("AI Recommendation error:", err);
      }
    }

    if (!aiRecommendation) {
        const daysRemaining = salesVelocity > 0 ? Math.floor(currentStock / salesVelocity) : 999;
        const urgency = daysRemaining < 3 ? 'CRITICAL' : daysRemaining < 7 ? 'HIGH' : daysRemaining < 14 ? 'MEDIUM' : 'LOW';
        const suggestedOrder = Math.ceil(salesVelocity * 20 + (minThreshold || 5)); 

        aiRecommendation = `**${urgency} RISK**: Stock is projected to deplete in approximately ${daysRemaining} days. Based on current daily velocity of ${salesVelocity.toFixed(2)}, I recommend a replenishment order of **${suggestedOrder} units** immediately to avoid a stockout event during the next lead time window.`;
    }

    return NextResponse.json({
        success: true,
        data: {
            forecast,
            recommendation: aiRecommendation,
            velocity: salesVelocity,
            daysRemaining: salesVelocity > 0 ? Math.floor(currentStock / salesVelocity) : 999
        }
    });

  } catch (error) {
    console.error('Forecasting API Error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
