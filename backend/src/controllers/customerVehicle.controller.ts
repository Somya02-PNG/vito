import { Request, Response } from 'express';
import CustomerVehicle, { ICustomerVehicle } from '../models/CustomerVehicle.model';

/**
 * Get all registered vehicles for the authenticated customer
 * GET /api/customer/vehicles
 */
export const getMyVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const vehicles = await CustomerVehicle.find({ customerId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        count: vehicles.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer vehicles:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch vehicles' });
  }
};

/**
 * Register a new vehicle for the authenticated customer
 * POST /api/customer/vehicles
 */
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      make,
      model,
      variant,
      registrationNumber,
      registrationState,
      year,
      fuelType,
      transmission,
      seatingCapacity,
      color,
      imageUrl,
      isDefault,
    } = req.body;

    if (!make || !model || !registrationNumber) {
      res.status(400).json({
        success: false,
        message: 'Make, model, and registration number are required.',
      });
      return;
    }

    // Check if this is the customer's first vehicle
    const existingCount = await CustomerVehicle.countDocuments({ customerId });
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      // Unset previous defaults
      await CustomerVehicle.updateMany({ customerId }, { $set: { isDefault: false } });
    }

    const vehicle = await CustomerVehicle.create({
      customerId,
      make: make.trim(),
      vehicleModel: (model || req.body.vehicleModel || '').trim(),
      variant: variant?.trim(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      registrationState: registrationState?.trim(),
      year: year ? Number(year) : undefined,
      fuelType: fuelType || 'petrol',
      transmission: transmission || 'manual',
      seatingCapacity: seatingCapacity ? Number(seatingCapacity) : 5,
      color: color?.trim(),
      imageUrl: imageUrl?.trim(),
      verificationStatus: 'VERIFIED',
      isDefault: shouldBeDefault,
      documents: [],
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: { vehicle },
    });
  } catch (error: any) {
    console.error('Error registering vehicle:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to register vehicle' });
  }
};

/**
 * Update a customer vehicle
 * PUT /api/customer/vehicles/:id
 */
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    const { id } = req.params;

    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const vehicle = await CustomerVehicle.findOne({ _id: id, customerId });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized' });
      return;
    }

    const {
      make,
      model,
      variant,
      registrationNumber,
      registrationState,
      year,
      fuelType,
      transmission,
      seatingCapacity,
      color,
      imageUrl,
      isDefault,
    } = req.body;

    if (isDefault) {
      await CustomerVehicle.updateMany(
        { customerId, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
      vehicle.isDefault = true;
    }

    if (make) vehicle.make = make.trim();
    if (model || req.body.vehicleModel) vehicle.vehicleModel = (model || req.body.vehicleModel).trim();
    if (variant !== undefined) vehicle.variant = variant.trim();
    if (registrationNumber) vehicle.registrationNumber = registrationNumber.trim().toUpperCase();
    if (registrationState !== undefined) vehicle.registrationState = registrationState.trim();
    if (year) vehicle.year = Number(year);
    if (fuelType) vehicle.fuelType = fuelType;
    if (transmission) vehicle.transmission = transmission;
    if (seatingCapacity) vehicle.seatingCapacity = Number(seatingCapacity);
    if (color !== undefined) vehicle.color = color.trim();
    if (imageUrl !== undefined) vehicle.imageUrl = imageUrl.trim();

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: { vehicle },
    });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update vehicle' });
  }
};

/**
 * Delete a customer vehicle
 * DELETE /api/customer/vehicles/:id
 */
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    const { id } = req.params;

    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const deleted = await CustomerVehicle.findOneAndDelete({ _id: id, customerId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized' });
      return;
    }

    // If deleted vehicle was default, make the newest remaining vehicle default
    if (deleted.isDefault) {
      const remaining = await CustomerVehicle.findOne({ customerId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete vehicle' });
  }
};

/**
 * Set a vehicle as default
 * PUT /api/customer/vehicles/:id/default
 */
export const setDefaultVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    const { id } = req.params;

    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const vehicle = await CustomerVehicle.findOne({ _id: id, customerId });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized' });
      return;
    }

    await CustomerVehicle.updateMany({ customerId }, { $set: { isDefault: false } });
    vehicle.isDefault = true;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Default vehicle updated.',
      data: { vehicle },
    });
  } catch (error: any) {
    console.error('Error setting default vehicle:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to set default vehicle' });
  }
};

/**
 * Upload a document for a customer vehicle
 * POST /api/customer/vehicles/:id/documents
 */
export const uploadVehicleDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?._id;
    const { id } = req.params;
    const { documentType, documentNumber, fileName, storagePath } = req.body;

    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const vehicle = await CustomerVehicle.findOne({ _id: id, customerId });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized' });
      return;
    }

    const doc = {
      documentType: documentType || 'RC',
      documentNumber: documentNumber || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      storagePath: storagePath || `/uploads/customer_vehicles/${id}/${Date.now()}.pdf`,
      fileName: fileName || `${documentType || 'RC'}_document.pdf`,
      verificationStatus: 'VERIFIED' as const,
      uploadedAt: new Date(),
    };

    vehicle.documents.push(doc as any);
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle document uploaded and verified.',
      data: { document: doc },
    });
  } catch (error: any) {
    console.error('Error uploading vehicle document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload document' });
  }
};
