export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly currentState: string,
    public readonly action: string,
    public readonly allowedActions: string[],
  ) {
    super(
      `Cannot execute action '${action}' from state '${currentState}'. Allowed actions: [${allowedActions.join(', ')}]`,
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export type TransitionMap<TState extends string, TAction extends string> = {
  [state in TState]?: {
    [action in TAction]?: TState;
  };
};

export class StateMachine<TState extends string, TAction extends string> {
  constructor(private readonly transitions: TransitionMap<TState, TAction>) {}

  getNextState(currentState: TState, action: TAction): TState {
    const validActions = this.transitions[currentState];
    if (!validActions || !(action in validActions)) {
      const allowed = validActions ? (Object.keys(validActions) as string[]) : [];
      throw new InvalidStateTransitionError(currentState, action, allowed);
    }
    return validActions[action] as TState;
  }

  canTransition(currentState: TState, action: TAction): boolean {
    const validActions = this.transitions[currentState];
    return !!validActions && action in validActions;
  }

  getAllowedActions(currentState: TState): TAction[] {
    const validActions = this.transitions[currentState];
    return validActions ? (Object.keys(validActions) as TAction[]) : [];
  }
}
