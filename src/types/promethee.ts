export type PreferenceFunction = (difference: number) => number;

export interface ConfigurablePreferenceFunctionsInterface {
  get preferenceFunctions(): PreferenceFunction[];
  set preferenceFunctions(preferenceFunctions: PreferenceFunction[]);
}
