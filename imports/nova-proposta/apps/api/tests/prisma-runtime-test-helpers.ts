export function injectPrismaDelegates(
  client: object,
  delegateNames: readonly string[]
): () => void {
  const originals = delegateNames.map((delegateName) => [
    delegateName,
    Reflect.get(client, delegateName)
  ]) as Array<readonly [string, unknown]>;

  for (const [delegateName, originalValue] of originals) {
    if (!originalValue) {
      Reflect.set(client, delegateName, {});
    }
  }

  return () => {
    for (const [delegateName, originalValue] of originals) {
      Reflect.set(client, delegateName, originalValue);
    }
  };
}
