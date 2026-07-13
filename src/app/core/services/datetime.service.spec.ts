import { DateTimeService } from './datetime.service';

describe('DateTimeService household wall-clock', () => {
  const service = new DateTimeService();

  it('interprets Sao Paulo and New York wall clocks as different instants', () => {
    expect(service.parseAPIDate('2026-07-13T00:30:00', 'America/Sao_Paulo')?.toISOString())
      .toBe('2026-07-13T03:30:00.000Z');
    expect(service.parseAPIDate('2026-07-13T00:30:00', 'America/New_York')?.toISOString())
      .toBe('2026-07-13T04:30:00.000Z');
  });

  it('honors New York daylight saving time', () => {
    expect(service.parseAPIDate('2026-01-15T09:00:00', 'America/New_York')?.toISOString())
      .toBe('2026-01-15T14:00:00.000Z');
    expect(service.parseAPIDate('2026-07-15T09:00:00', 'America/New_York')?.toISOString())
      .toBe('2026-07-15T13:00:00.000Z');
  });

  it('sends an instant when browser and household timezones differ', () => {
    spyOn(service, 'browserTimezone').and.returnValue('America/Sao_Paulo');
    const date = new Date('2026-07-15T12:00:00.000Z');
    expect(service.formatCareDateTimeForAPI(date, 'America/New_York')).toBe('2026-07-15T12:00:00.000Z');
  });
});
