import { nativeToScVal, rpc } from "@stellar/stellar-sdk";
import { GovernanceContractMethod } from "./governance-constants";
import { buildReadContractTransaction, buildWriteContractTransaction, encodeProposalAction, toAddressScVal, toBytesN32ScVal, toOptionalProposalStatusScVal, } from "./governance-utils";
export class GovernanceClient {
    constructor(config) {
        this.contractId = config.contractId;
        this.networkPassphrase = config.networkPassphrase;
        this.server = config.server ?? new rpc.Server(config.rpcUrl);
    }
    async createProposal(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.proposer, GovernanceContractMethod.CreateProposal, [
            toAddressScVal(params.proposer),
            encodeProposalAction(params.action),
            toBytesN32ScVal(params.descriptionHash),
            nativeToScVal(params.proposedValue, { type: "i128" }),
        ]);
    }
    async castVote(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.voter, GovernanceContractMethod.CastVote, [
            toAddressScVal(params.voter),
            nativeToScVal(params.proposalId, { type: "u64" }),
            nativeToScVal(params.support, { type: "bool" }),
        ]);
    }
    async executeProposal(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.source, GovernanceContractMethod.ExecuteProposal, [
            nativeToScVal(params.proposalId, { type: "u64" }),
            nativeToScVal(params.totalSupply, { type: "i128" }),
        ]);
    }
    async vetoProposal(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.admin, GovernanceContractMethod.VetoProposal, [
            nativeToScVal(params.proposalId, { type: "u64" }),
            toBytesN32ScVal(params.reasonHash),
        ]);
    }
    async delegateVotes(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.delegator, GovernanceContractMethod.DelegateVotes, [toAddressScVal(params.delegator), toAddressScVal(params.delegate)]);
    }
    async undelegateVotes(params) {
        return buildWriteContractTransaction(this.server, this.contractId, this.networkPassphrase, params.delegator, GovernanceContractMethod.UndelegateVotes, [toAddressScVal(params.delegator)]);
    }
    getProposal(params) {
        return buildReadContractTransaction(this.contractId, this.networkPassphrase, GovernanceContractMethod.GetProposal, [nativeToScVal(params.proposalId, { type: "u64" })]);
    }
    listProposals(params = {}) {
        const page = params.page ?? 0;
        const pageSize = params.pageSize ?? 20;
        return buildReadContractTransaction(this.contractId, this.networkPassphrase, GovernanceContractMethod.ListProposals, [
            toOptionalProposalStatusScVal(params.status),
            nativeToScVal(page, { type: "u32" }),
            nativeToScVal(pageSize, { type: "u32" }),
        ]);
    }
}
export { GovernanceContractMethod, GOVERNANCE_TESTNET, GOVERNANCE_TESTNET_CONTRACT_ID, } from "./governance-constants";
export { ProposalActionKind, ProposalStatus, } from "./governance-types";
export { parseGovernanceProposal, parseGovernanceProposalListSimulation, parseGovernanceProposalSimulation, } from "./governance-parser";
