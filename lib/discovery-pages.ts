export function fillDiscoveryTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`%${key}%`, 'g'), String(value)),
    template
  );
}
