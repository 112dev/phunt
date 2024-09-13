export type ObjectWithCodeProperty = {
  code: string;
};

/**
 * Checks if the given object contains a `code` property of type string.
 *
 * This function is a type guard that verifies whether the provided object has
 * a `code` property, which is a string. It is used to narrow down the type of
 * the object to `ObjectWithCodeProperty`.
 *
 * @param object - The object to check.
 * @returns Returns `true` if the object contains a `code` property of type string; otherwise, returns `false`.
 */
export function objectContainsCodeProperty(
  object: unknown,
): object is ObjectWithCodeProperty {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as ObjectWithCodeProperty).code === "string"
  );
}

export type ObjectWithMessageProperty = {
  message: string;
};

/**
 * Checks if the given object contains a `message` property of type string.
 *
 * This function is a type guard that verifies whether the provided object has
 * a `message` property, which is a string. It is used to narrow down the type of
 * the object to `ObjectWithMessageProperty`.
 *
 * @param object - The object to check.
 * @returns Returns `true` if the object contains a `message` property of type string; otherwise, returns `false`.
 */
export function objectContainsMessageProperty(
  object: unknown,
): object is ObjectWithMessageProperty {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as ObjectWithMessageProperty).message === "string"
  );
}
