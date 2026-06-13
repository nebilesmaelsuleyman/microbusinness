export declare class VerifyOtpDto {
    phoneNumber: string;
    otp: string;
    name?: string;
    role?: 'customer' | 'provider' | 'admin';
}
