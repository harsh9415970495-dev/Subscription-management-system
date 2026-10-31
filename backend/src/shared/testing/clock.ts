export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class TestClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date = new Date()) {
    this.currentTime = new Date(initialTime);
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  setTime(time: Date): void {
    this.currentTime = new Date(time);
  }

  advanceByDays(days: number): void {
    this.currentTime.setDate(this.currentTime.getDate() + days);
  }

  advanceByHours(hours: number): void {
    this.currentTime.setHours(this.currentTime.getHours() + hours);
  }
}

export const CLOCK_SERVICE = 'CLOCK_SERVICE';
