//import { clean, createToken } from '../../common';
const moment = require('moment-timezone')
import mongoose from 'mongoose'
import { User, UserModel, UserWithId } from '../db/models/user'
interface UpdateUserResponse {
  success: boolean
  data?: UserWithId | null
  msg: string
}
export class UserDal {
  createUser = async (userData: User) => {
    try {
      await mongoose.connect(process.env.DATABASE_URL as string)

      if (!UserModel.collection) {
        await UserModel.createCollection()
      }

      const data: UserWithId = await UserModel.create(userData)

      return { success: true, data, msg: `User with id  has been created` }
    } catch (error) {
      return { success: false, msg: 'User creation error: ' + error }
    } finally {
      await mongoose.disconnect()
    }
  }

  getUserById = async (id: mongoose.Types.ObjectId) => {
    try {
      // Ensure Mongoose is connected
      await mongoose.connect(process.env.DATABASE_URL as string)

      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB is not connected')
      }

      const data = await UserModel.findById(id).exec()
      if (data != null) {
        return { success: true, data, msg: 'user retrived by id' }
      } else {
        throw 'User not exist'
      }
    } catch (error) {
      console.error('Error in getUser:', error)
      throw error // Re-throw the error for handling in caller function
    } finally {
      await mongoose.disconnect()
    }
  }

  getUserByEmail = async (email: String) => {
    try {
      // Ensure Mongoose is connected
      await mongoose.connect(process.env.DATABASE_URL as string)

      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB is not connected')
      }

      const data: UserWithId = await UserModel.findOne({ email: email }).exec()
      return { success: true, data, msg: 'user retrived by email' }
    } catch (error) {
      console.error('Error in getUser:', error)
      throw error // Re-throw the error for handling in caller function
    } finally {
      await mongoose.disconnect()
    }
  }

  getUsersByRoomId = async (roomId: mongoose.Types.ObjectId) => {
    try {
      await mongoose.connect(process.env.DATABASE_URL as string)
      const users = await UserModel.find({ room_id: roomId })
      return {
        success: true,
        data: users,
        msg: 'Users by room id ware retieved'
      }
    } catch (err) {
      console.error('Error in getUsersByRoomId:', err)
      return { success: false, msg: 'Error in getUsersByRoomId:' + err }
    } finally {
      await mongoose.disconnect()
    }
  }

  removeRoomFromUsers = async (
    roomId: mongoose.Types.ObjectId
  ): Promise<any> => {
    try {
      await mongoose.connect(process.env.DATABASE_URL as string)

      // Update all users with the given room ID and set their room_id to null
      await UserModel.updateMany(
        { room_id: roomId },
        { $set: { room_id: null } }
      )

      return { success: true, msg: 'Users successfully updated' }
    } catch (err) {
      console.error('Error in removeRoomFromUsers:', err)
      return { success: false, msg: 'Error updating users: ' + err.message }
    } finally {
      await mongoose.disconnect()
    }
  }

  updateUser = async (
    id: mongoose.Types.ObjectId,
    updatedUserData: Partial<UserWithId>
  ) => {
    try {
      await mongoose.connect(process.env.DATABASE_URL as string)

      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        updatedUserData,
        {
          new: true
        }
      )

      if (!updatedUser) {
        return { success: false, msg: 'User not found' }
      }

      return {
        success: true,
        data: updatedUser,
        msg: `User, with id ${updatedUser._id}, has been updated`
      }
    } catch (err) {
      return { success: false, msg: 'Error: ' + (err as Error).message }
    } finally {
      await mongoose.disconnect()
    }
  }

  deleteUser = (id: mongoose.Types.ObjectId) => {
    return new Promise<void>(async (resolve, reject) => {
      mongoose.connect(process.env.DATABASE_URL as string).then(async () => {
        await UserModel.findByIdAndDelete(id)
          .exec()
          .catch(err => {
            if (err) {
              reject(err)
            }
          })
        resolve()
      })
    })
  }
}
