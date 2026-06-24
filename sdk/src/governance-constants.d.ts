export declare const GOVERNANCE_READ_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
export declare const GOVERNANCE_TX_TIMEOUT_SEC = 30;
export declare const GOVERNANCE_TESTNET_CONTRACT_ID = "CD7GOIU3GNK7EZHG7XWBC7VI4NRVGMRCU7X2FOCAPQN6EGTSW46BY4EB";
export declare const GOVERNANCE_TESTNET: {
    contractId: string;
    rpcUrl: string;
    networkPassphrase: string;
};
export declare const GovernanceContractMethod: {
    readonly CreateProposal: "create_proposal";
    readonly CastVote: "cast_vote";
    readonly ExecuteProposal: "execute_proposal";
    readonly VetoProposal: "veto_proposal";
    readonly DelegateVotes: "delegate_votes";
    readonly UndelegateVotes: "undelegate_votes";
    readonly GetProposal: "get_proposal";
    readonly ListProposals: "list_proposals";
};
export type GovernanceContractMethodName = (typeof GovernanceContractMethod)[keyof typeof GovernanceContractMethod];
export declare const HASH_BYTE_LENGTH = 32;
//# sourceMappingURL=governance-constants.d.ts.map