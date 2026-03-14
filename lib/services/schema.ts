export function isSchemaCacheMissingRelation(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    message.includes("schema cache") &&
    (message.includes("could not find the table") ||
      message.includes("could not find the '") ||
      message.includes("could not find the function"))
  );
}

export function isUndefinedColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return message.includes("column") && message.includes("does not exist");
}

export function isMissingSchemaFeatureError(error: { message?: string } | null | undefined) {
  return isSchemaCacheMissingRelation(error) || isUndefinedColumnError(error);
}
