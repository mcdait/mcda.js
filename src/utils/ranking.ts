export function rank(pref: readonly number[], reverse = true): number[] {
  const sortedUniquePreferences = [...new Set(pref)].sort((left, right) =>
    reverse ? right - left : left - right,
  );

  const ranksByPreference = new Map(
    sortedUniquePreferences.map((preference, index) => [preference, index + 1]),
  );

  return pref.map((preference) => ranksByPreference.get(preference) ?? 0);
}
