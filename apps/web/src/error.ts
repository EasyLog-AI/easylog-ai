/**
 * Error thrown when an invalid argument is provided to a function.
 */
export class InvalidArgumentError extends Error {
  public readonly parameter: string;
  public readonly value: unknown;

  constructor({
    parameter,
    value,
    message,
  }: {
    parameter: string;
    value: unknown;
    message: string;
  }) {
    super(message);
    this.name = 'InvalidArgumentError';
    this.parameter = parameter;
    this.value = value;
  }
}