export class MissingRouteArgumentError extends Error {
  constructor(name: string) {
    super(`${name} is required.`);
    this.name = 'MissingRouteArgumentError';
  }
}

export const requireString = (
  value: unknown,
  name: string,
): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new MissingRouteArgumentError(name);
  }

  return value;
};
