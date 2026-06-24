// !! AUTO-GENERATED — do not edit by hand.
// Re-generate with: pnpm generate:types
// Source: ILN-Smart-Contract/target/spec.json
/** Status of an invoice in its lifecycle. */
export var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus[InvoiceStatus["Pending"] = 0] = "Pending";
    InvoiceStatus[InvoiceStatus["Funded"] = 1] = "Funded";
    InvoiceStatus[InvoiceStatus["Paid"] = 2] = "Paid";
    InvoiceStatus[InvoiceStatus["Defaulted"] = 3] = "Defaulted";
})(InvoiceStatus || (InvoiceStatus = {}));
/** Contract-level errors returned by the ILN smart contract. */
export var ContractError;
(function (ContractError) {
    ContractError[ContractError["InvoiceNotFound"] = 1] = "InvoiceNotFound";
    ContractError[ContractError["AlreadyFunded"] = 2] = "AlreadyFunded";
    ContractError[ContractError["AlreadyPaid"] = 3] = "AlreadyPaid";
    ContractError[ContractError["NotFunder"] = 4] = "NotFunder";
    ContractError[ContractError["NotPayer"] = 5] = "NotPayer";
    ContractError[ContractError["NotDueYet"] = 6] = "NotDueYet";
    ContractError[ContractError["InvalidAmount"] = 7] = "InvalidAmount";
    ContractError[ContractError["InvalidDiscount"] = 8] = "InvalidDiscount";
    ContractError[ContractError["InvalidDueDate"] = 9] = "InvalidDueDate";
    ContractError[ContractError["Unauthorized"] = 10] = "Unauthorized";
})(ContractError || (ContractError = {}));
