import { describe, it, expect } from 'vitest';
import { StateMachine, InvalidStateTransitionError } from '../state-machine';

type TestState = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
type TestAction = 'CONFIRM' | 'PAY' | 'CANCEL';

describe('StateMachine Helper', () => {
  const fsm = new StateMachine<TestState, TestAction>({
    DRAFT: {
      CONFIRM: 'CONFIRMED',
      CANCEL: 'CANCELLED',
    },
    CONFIRMED: {
      PAY: 'PAID',
      CANCEL: 'CANCELLED',
    },
    PAID: {},
    CANCELLED: {},
  });

  it('allows valid transitions', () => {
    expect(fsm.getNextState('DRAFT', 'CONFIRM')).toBe('CONFIRMED');
    expect(fsm.getNextState('CONFIRMED', 'PAY')).toBe('PAID');
  });

  it('checks transition validity with canTransition', () => {
    expect(fsm.canTransition('DRAFT', 'CONFIRM')).toBe(true);
    expect(fsm.canTransition('DRAFT', 'PAY')).toBe(false);
  });

  it('throws InvalidStateTransitionError on illegal action', () => {
    expect(() => fsm.getNextState('PAID', 'CONFIRM')).toThrow(InvalidStateTransitionError);
    expect(() => fsm.getNextState('PAID', 'CONFIRM')).toThrow(
      "Cannot execute action 'CONFIRM' from state 'PAID'",
    );
  });

  it('lists allowed actions for a given state', () => {
    expect(fsm.getAllowedActions('DRAFT')).toEqual(['CONFIRM', 'CANCEL']);
    expect(fsm.getAllowedActions('PAID')).toEqual([]);
  });
});
