import { SetMetadata } from '@nestjs/common';

export const PREMIUM_REQUIRED_KEY = 'premium_required';
export const PremiumRequired = () => SetMetadata(PREMIUM_REQUIRED_KEY, true);
