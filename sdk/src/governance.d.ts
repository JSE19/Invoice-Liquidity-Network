import type { CastVoteParams, CreateProposalParams, DelegateVotesParams, ExecuteProposalParams, GetProposalParams, GovernanceClientConfig, ListProposalsParams, UndelegateVotesParams, VetoProposalParams } from "./governance-types";
import { type BuiltTransaction } from "./governance-utils";
export declare class GovernanceClient {
    private readonly contractId;
    private readonly networkPassphrase;
    private readonly server;
    constructor(config: GovernanceClientConfig);
    createProposal(params: CreateProposalParams): Promise<BuiltTransaction>;
    castVote(params: CastVoteParams): Promise<BuiltTransaction>;
    executeProposal(params: ExecuteProposalParams): Promise<BuiltTransaction>;
    vetoProposal(params: VetoProposalParams): Promise<BuiltTransaction>;
    delegateVotes(params: DelegateVotesParams): Promise<BuiltTransaction>;
    undelegateVotes(params: UndelegateVotesParams): Promise<BuiltTransaction>;
    getProposal(params: GetProposalParams): BuiltTransaction;
    listProposals(params?: ListProposalsParams): BuiltTransaction;
}
export { GovernanceContractMethod, GOVERNANCE_TESTNET, GOVERNANCE_TESTNET_CONTRACT_ID, } from "./governance-constants";
export { ProposalActionKind, ProposalStatus, type CastVoteParams, type CreateProposalParams, type DelegateVotesParams, type ExecuteProposalParams, type GetProposalParams, type GovernanceClientConfig, type GovernanceProposal, type ListProposalsParams, type ProposalAction, type UndelegateVotesParams, type VetoProposalParams, } from "./governance-types";
export { parseGovernanceProposal, parseGovernanceProposalListSimulation, parseGovernanceProposalSimulation, } from "./governance-parser";
//# sourceMappingURL=governance.d.ts.map