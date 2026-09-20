import { UtilityMobilePage, type UtilityMobileKind } from "./components/screens";

/**
 * @ployComponent
 * @ployComponentId purplelife-utility-mobile-page
 * @ployComponentType page
 * @ployComponentDescription Thin page compositor for the PurpleLife mobile utility screen family.
 * @ployComponentTags purplelife mobile utility page
 * @ployComponentStatus experimental
 */
export default function UtilityPage({ kind }: { kind: UtilityMobileKind }) {
  return <UtilityMobilePage kind={kind} />;
}
