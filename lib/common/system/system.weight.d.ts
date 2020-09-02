export declare const GetSystemWeight: () => Promise<{
    weight: number;
    cpu: number;
    heap: number;
    avg5: number;
    avg15: number;
}>;
