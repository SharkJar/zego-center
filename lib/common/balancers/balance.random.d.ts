import { BalanceBase } from './balance.base';
import { balancers } from './balance.manage.interface';
export declare class Random extends BalanceBase implements balancers {
    getAddress(): string;
}
