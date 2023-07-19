/** MIT License github.com/pushkine/ */
export interface SpringParams {
    mass: number;
    damping: number;
    stiffness: number;
    soft: boolean;
}
export declare class Spring {
    private currentPosition;
    private targetPosition;
    private currentTime;
    private params;
    private currentSolver;
    private getV;
    private queueParams;
    private queuePosition;
    constructor(currentPosition?: number);
    private resetSolver;
    setPosition(targetPosition: number): void;
    update(delta?: number): void;
    updateParams(params: Partial<SpringParams>, delay?: number): void;
    setTargetPosition(targetPosition: number, delay?: number): void;
    getCurrentPosition(): number;
}
