import { Response } from "express";
import { Connection } from "../models/Connection";
import { User } from "../models/User";

import { sendNotification } from "../utils/notificationUtils";

export const sendConnectionRequest = async (req: any, res: Response) => {
  try {
    const { recipientId } = req.body;

    if (req.user._id.toString() === recipientId) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === "Rejected") {
        existingConnection.requester = req.user._id;
        existingConnection.recipient = recipientId;
        existingConnection.status = "Pending";
        await existingConnection.save();

        await sendNotification({
          recipient: recipientId,
          sender: req.user._id,
          type: "connection_request",
          relatedId: existingConnection._id.toString(),
          message: `${req.user.name} sent you a connection request.`
        });

        return res.status(200).json({ message: "Connection request sent", connection: existingConnection });
      }
      return res.status(400).json({ message: "Connection request already exists" });
    }

    const connection = new Connection({
      requester: req.user._id,
      recipient: recipientId,
    });

    await connection.save();

    // Send Notification
    await sendNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: "connection_request",
      relatedId: connection._id.toString(),
      message: `${req.user.name} sent you a connection request.`
    });

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptConnection = async (req: any, res: Response) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    connection.status = "Accepted";
    await connection.save();

    // Send Notification to the requester
    await sendNotification({
      recipient: connection.requester.toString(),
      sender: req.user._id,
      type: "accepted",
      relatedId: connection._id.toString(),
      message: `${req.user.name} accepted your connection request.`
    });

    res.json({ message: "Connection accepted", connection });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyConnections = async (req: any, res: Response) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: "Accepted",
    })
      .populate("requester", "name email profileImage headline")
      .populate("recipient", "name email profileImage headline");

    res.json(connections);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getConnectionStatuses = async (req: any, res: Response) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    });
    res.json(connections);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectConnection = async (req: any, res: Response) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    connection.status = "Rejected";
    await connection.save();

    // Silently notify the requester to update their UI
    const { io } = require("../index");
    io.in(connection.requester.toString()).emit("connection_removed", { userId: req.user._id });

    res.json({ message: "Connection rejected" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingRequests = async (req: any, res: Response) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: "Pending",
    }).populate("requester", "name email profileImage headline");

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeConnection = async (req: any, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const connection = await Connection.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: targetUserId },
        { requester: targetUserId, recipient: currentUserId },
      ],
      status: "Accepted",
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Silently notify the other user to update their UI
    const { io } = require("../index");
    const otherUserId = connection.requester.toString() === req.user._id.toString() 
      ? connection.recipient.toString() 
      : connection.requester.toString();
    
    io.in(otherUserId).emit("connection_removed", { userId: req.user._id });

    res.json({ message: "Connection removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
