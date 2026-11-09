type Data = Record<string, unknown>;
const record = (value: unknown): Data => value && typeof value === "object" ? value as Data : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

// Keep the existing address response contract while using an autocomplete-capable OSM provider.
export function photonAddresses(payload: unknown) {
  const features = record(payload).features;
  if (!Array.isArray(features)) throw new Error("Invalid address search response.");
  const seen = new Set<string>();
  return features.flatMap((item) => {
    const feature = record(item); const properties = record(feature.properties); const geometry = record(feature.geometry);
    const coordinates = geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.slice(0, 2).every((v) => typeof v === "number" && Number.isFinite(v))) return [];
    if (text(properties.countrycode).toUpperCase() !== "NG" && text(properties.country).toLowerCase() !== "nigeria") return [];
    const name = text(properties.name); const road = text(properties.street) || (properties.type === "street" ? name : "");
    const house = text(properties.housenumber); const city = text(properties.city) || text(properties.county) || text(properties.district) || text(properties.locality);
    const state = text(properties.state); const postcode = text(properties.postcode);
    const streetLine = [house, road].filter(Boolean).join(" ");
    const parts = [name !== road ? name : "", streetLine || name, text(properties.district), city, state, "Nigeria"].filter(Boolean);
    const displayName = Array.from(new Set(parts)).join(", "); const identity = displayName.toLowerCase();
    if (seen.has(identity)) return []; seen.add(identity);
    return [{ name, display_name: displayName, lat: String(coordinates[1]), lon: String(coordinates[0]),
      address: { house_number: house, road, city, state, postcode, country: "Nigeria" } }];
  });
}
