export { default as User } from './User.model';
export type { IUser, UserRole } from './User.model';

export { default as Driver } from './Driver.model';
export type { IDriver, VerificationStatus } from './Driver.model';

export { default as Vehicle } from './Vehicle.model';
export type { IVehicle, VehicleCategory, FuelType, TransmissionType, IVehicleLocation } from './Vehicle.model';

export { default as Ride } from './Ride.model';
export type { IRide, RideStatus, IRideLocation } from './Ride.model';

export { default as Rental } from './Rental.model';
export type { IRental, RentalStatus, DepositStatus, AddOnType } from './Rental.model';

export { default as Trip } from './Trip.model';
export type { ITrip, IParticipant } from './Trip.model';

export { default as Expense } from './Expense.model';
export type { IExpense, ExpenseCategory, SplitType } from './Expense.model';

export { default as EmergencyContact } from './EmergencyContact.model';
export type { IEmergencyContact } from './EmergencyContact.model';
