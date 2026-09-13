export interface AuthResponse {
  token: string;
  memberId: number;
  email: string;
  displayName: string;
  groupId: number;
  groupName: string;
  inviteCode: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupCreateGroupRequest {
  email: string;
  password: string;
  displayName: string;
  groupName: string;
}

export interface SignupJoinGroupRequest {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
}

export type ContributionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface ContributionResponse {
  id: number;
  groupId: number;
  memberId: number;
  amount: number;
  type: ContributionType;
  note?: string;
  contributedAt: string;
}

export interface ContributionRequest {
  amount: number;
  type: ContributionType;
  note?: string;
  contributedAt: string;
}

export interface ContributionTotalResponse {
  totalDeposits: number;
  totalWithdrawals: number;
  netTotal: number;
}

export interface HoldingResponse {
  id: number;
  groupId: number;
  symbol: string;
  quantity: number;
  averageCost: number;
  updatedAt: string;
}

export interface IpoHoldingResponse {
  id: number;
  groupId: number;
  ipoName: string;
  amount: number;
  investedDate: string;
}

export interface IpoHoldingRequest {
  ipoName: string;
  amount: number;
  investedDate: string;
}

export type TradeType = 'BUY' | 'SELL';

export interface TradeResponse {
  id: number;
  groupId: number;
  symbol: string;
  tradeType: TradeType;
  quantity: number;
  price: number;
  tradedAt: string;
  note?: string;
}

export interface TradeRequest {
  symbol: string;
  tradeType: TradeType;
  quantity: number;
  price: number;
  tradedAt: string;
  note?: string;
}

export interface PortfolioSummaryResponse {
  groupId: number;
  totalContributed: number;
  stockHoldingsValue: number;
  ipoHoldingsValue: number;
  availableCash: number;
}

export interface MemberProfitShareResponse {
  memberId: number;
  memberDisplayName: string;
  unitsHeld: number;
  unitSharePercentage: number;
  totalContributed: number;
  totalInvested: number;
  availableCashWithoutPl: number;
  realizedProfitLoss: number;
  availableCashWithPl: number;
  currentValue: number;
  profitLoss: number;
}

export interface ValuationSnapshotResponse {
  id: number;
  groupId: number;
  totalValue: number;
  snapshotAt: string;
  memberShares: MemberProfitShareResponse[];
}

export interface ValuationSnapshotRequest {
  totalValue: number;
  snapshotAt: string;
}
