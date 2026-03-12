export interface IpRangeResponse {
    ipRangeId: number;
    ipRange: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IpRangeRequest {
    ipRange: string;
    description: string;
    isActive?: boolean;
}

