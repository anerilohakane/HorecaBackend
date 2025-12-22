// // app/api/tasks/route.js
// // Full API Route for Tasks: Handles GET (fetch all), POST (create), PUT (update by ID in body)
// // Built from your Mongoose schema + Zod validation + robust error handling (from your [id] style)
// // Dependencies: next-zod-route (npm i next-zod-route), your schema.js, models, dbConnect

// import { createZodRoute } from 'next-zod-route';
// import { NextResponse } from 'next/server';
// import mongoose from 'mongoose';
// import dbConnect from '@/lib/db/connect'; // Your connect helper
// import Task from '@/lib/db/models/tasks/Task'; // Adjust path to your model
// import User from '@/lib/db/models/User'; // Assume User model for validation (create if needed)
// import { createTaskSchema, updateTaskSchema } from '../../tasks/schema'; // Your Zod mirror
// // Helper: Transform Mongoose doc to frontend-friendly (ISO dates, string IDs)
// function transformTask(taskDoc) {
//   if (!taskDoc) throw new Error('Invalid task document');
//   const task = taskDoc.toObject({ virtuals: true, getters: true, minimize: false });
//   if (!task || !task._id) throw new Error('Task missing _id after conversion');

//   const idStr = task._id.toString();
//   if (!idStr || idStr === 'undefined') throw new Error('Invalid _id string conversion');

//   return {
//     ...task,
//     _id: idStr,
//     dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
//     startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
//     createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
//     updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
//     completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
//     // Handle populated fields (e.g., assignedTo as object or ID string)
//     assignedTo: task.assignedTo ? (task.assignedTo._id ? {
//       _id: task.assignedTo._id.toString(),
//       name: task.assignedTo.name,
//       email: task.assignedTo.email
//     } : task.assignedTo) : null,
//     assignedBy: task.assignedBy ? (task.assignedBy._id ? {
//       _id: task.assignedBy._id.toString(),
//       name: task.assignedBy.name
//     } : task.assignedBy) : null,
//     project: task.project ? (task.project._id ? {
//       _id: task.project._id.toString(),
//       name: task.project.name
//     } : task.project) : null,
//     dependencies: task.dependencies ? task.dependencies.map(dep => dep._id ? dep._id.toString() : dep) : [],
//   };
// }

// export const GET = createZodRoute({
//   handler: async () => {
//     try {
//       console.log('🚀 Task GET API: Fetching all tasks');
//       await dbConnect();
//       console.log('✅ Database connected for GET');

//       const tasksDocs = await Task.find()
//         .populate('assignedTo', 'name email') // Join User details (employee)
//         .populate('assignedBy', 'name')
//         .populate('project', 'name')
//         .populate('dependencies', 'title') // Partial for deps
//         .sort({ dueDate: 1, priority: -1 }) // Due date ASC, priority DESC (Urgent first)
//         .lean();

//       const tasks = tasksDocs.map(transformTask);
//       console.log(`✅ Fetched ${tasks.length} tasks`);

//       return NextResponse.json({ 
//         success: true, 
//         tasks 
//       });
//     } catch (error) {
//       console.error('💥 Error in task GET API:', error);
//       return NextResponse.json({ 
//         success: false, 
//         error: error.message || 'Failed to fetch tasks',
//         details: 'Check server logs'
//       }, { status: 500 });
//     }
//   },
// });

// export const POST = createZodRoute({
//   body: createTaskSchema, // Auto-validates full schema (e.g., required dueDate, enum status)
//   handler: async (req) => {
//     try {
//       console.log('🚀 Task POST API: Creating new task');
//       await dbConnect();
//       console.log('✅ Database connected for POST');

//       const data = req.body;
//       console.log('📝 POST body:', data);

//       // Enforce relations: Validate assignedTo/By exist (like employee ID check)
//       const assignee = await User.findById(data.assignedTo);
//       if (!assignee) {
//         console.error('❌ Invalid assignedTo User');
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Invalid assignee - User not found' 
//         }, { status: 400 });
//       }

//       const assignedById = data.assignedBy || '66e2f79f3b8d2e1f1a9d9c33'; // Default from schema
//       if (assignedById !== '66e2f79f3b8d2e1f1a9d9c33') {
//         const assigner = await User.findById(assignedById);
//         if (!assigner) {
//           console.error('❌ Invalid assignedBy User');
//           return NextResponse.json({ 
//             success: false, 
//             error: 'Invalid assigner - User not found' 
//           }, { status: 400 });
//         }
//       }

//       // Create & populate
//       const taskDoc = await Task.create({ ...data, assignedBy: assignedById });
//       const populatedTask = await Task.findById(taskDoc._id)
//         .populate('assignedTo assignedBy project dependencies');
      
//       const transformedTask = transformTask(populatedTask);
      
//       if (Object.keys(transformedTask).length <= 1) {
//         throw new Error('Created task is minimal - schema issue?');
//       }

//       console.log('✅ Task created successfully:', transformedTask._id);
//       return NextResponse.json({ 
//         success: true, 
//         task: transformedTask 
//       }, { status: 201 });
//     } catch (error) {
//       console.error('💥 Error in task POST API:', error);
//       console.error('💥 Stack:', error.stack);
//       if (error.name === 'ZodError') {
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Invalid creation data', 
//           details: error.errors 
//         }, { status: 400 });
//       }
//       if (error.name === 'ValidationError') { // Mongoose schema errors
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Schema validation failed', 
//           details: Object.values(error.errors).map(e => e.message) 
//         }, { status: 400 });
//       }
//       return NextResponse.json({ 
//         success: false, 
//         error: error.message || 'Failed to create task',
//         details: 'Check server logs'
//       }, { status: 500 });
//     }
//   },
// });

// export const PUT = createZodRoute({
//   body: updateTaskSchema, // Partial schema for updates (optional fields)
//   handler: async (req) => {
//     try {
//       console.log('🚀 Task PUT API: Updating task');
//       await dbConnect();
//       console.log('✅ Database connected for PUT');

//       const body = req.body;
//       console.log('📝 PUT body:', body);

//       const { id } = body;
//       if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//         console.error('❌ Invalid task ID format:', id);
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Invalid task ID format' 
//         }, { status: 400 });
//       }

//       // Remove ID from update data
//       const { id: _, ...updateData } = body;
//       const finalUpdate = { 
//         ...updateData, 
//         updatedAt: new Date() // Always update timestamp
//       };

//       // Update & populate
//       const updatedTaskDoc = await Task.findByIdAndUpdate(
//         id,
//         finalUpdate,
//         { 
//           new: true, 
//           runValidators: true 
//         }
//       ).populate('assignedTo assignedBy project dependencies');

//       console.log('🔍 Updated doc raw:', JSON.stringify(updatedTaskDoc, null, 2));

//       if (!updatedTaskDoc) {
//         console.log('❌ Task not found for update');
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Task not found' 
//         }, { status: 404 });
//       }

//       const transformedTask = transformTask(updatedTaskDoc);

//       // Guard: Ensure meaningful data
//       if (Object.keys(transformedTask).length <= 1 || !transformedTask._id) {
//         console.error('❌ Updated task minimal after transform:', transformedTask);
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Update returned incomplete data - check schema' 
//         }, { status: 500 });
//       }

//       console.log('✅ Task updated successfully:', transformedTask._id);
//       return NextResponse.json({ 
//         success: true, 
//         task: transformedTask 
//       });
//     } catch (error) {
//       console.error('💥 Error in task PUT API:', error);
//       console.error('💥 Stack:', error.stack);
//       if (error.name === 'ZodError') {
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Invalid update data', 
//           details: error.errors 
//         }, { status: 400 });
//       }
//       if (error.name === 'CastError') {
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Invalid task ID provided' 
//         }, { status: 400 });
//       }
//       if (error.name === 'ValidationError') {
//         return NextResponse.json({ 
//           success: false, 
//           error: 'Schema validation failed', 
//           details: Object.values(error.errors).map(e => e.message) 
//         }, { status: 400 });
//       }
//       return NextResponse.json({ 
//         success: false, 
//         error: error.message || 'Failed to update task',
//         details: 'Check server logs'
//       }, { status: 500 });
//     }
//   },
// });


// File: app/api/tasks/[id]/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/connect';
import Task from '@/lib/db/models/tasks/Task';

// Helper: Transform Mongoose doc to frontend-friendly format
function transformTask(taskDoc) {
  if (!taskDoc) return null;
  
  const task = taskDoc.toObject({ virtuals: true, getters: true });
  
  return {
    ...task,
    _id: task._id.toString(),
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    assignedTo: task.assignedTo ? (task.assignedTo._id ? {
      _id: task.assignedTo._id.toString(),
      name: task.assignedTo.name,
      email: task.assignedTo.email
    } : task.assignedTo) : null,
    assignedBy: task.assignedBy ? (task.assignedBy._id ? {
      _id: task.assignedBy._id.toString(),
      name: task.assignedBy.name
    } : task.assignedBy) : null,
    dependencies: task.dependencies ? task.dependencies.map(dep => 
      dep._id ? dep._id.toString() : dep
    ) : [],
  };
}

// GET - Get single task by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('dependencies', 'title');

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const transformedTask = transformTask(task);
    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });

  } catch (error) {
    console.error('Error in task GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT - Update task by ID
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 PUT request body:', body);

    // Remove ID from update data if present
    const { id: _, ...updateData } = body;
    
    // Prepare update data
    const finalUpdate = { 
      ...updateData, 
      updatedAt: new Date()
    };

    // If status is being updated to Completed and completedAt is not provided, set it
    if (updateData.status === 'Completed' && !updateData.completedAt) {
      finalUpdate.completedAt = new Date();
    }

    // If status is changed from Completed to something else, clear completedAt
    if (updateData.status && updateData.status !== 'Completed') {
      const existingTask = await Task.findById(id);
      if (existingTask && existingTask.status === 'Completed') {
        finalUpdate.completedAt = null;
      }
    }

    console.log('🔧 Final update data:', finalUpdate);

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      finalUpdate,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name')
    .populate('dependencies', 'title');

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const transformedTask = transformTask(updatedTask);
    console.log('✅ Task updated successfully:', transformedTask._id);

    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });

  } catch (error) {
    console.error('Error in task PUT API:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: Object.values(error.errors).map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete task by ID
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log('✅ Task deleted successfully:', id);
    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    });

  } catch (error) {
    console.error('Error in task DELETE API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}