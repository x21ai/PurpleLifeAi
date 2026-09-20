import { RecordMobilePage, type RecordKind } from "./components/record-screen";

/**
 * @ployComponent
 * @ployComponentId purplelife-record-mobile-page
 * @ployComponentType page
 * @ployComponentDescription Thin page compositor for PurpleLife record detail routes.
 * @ployComponentTags purplelife mobile dynamic page
 * @ployComponentStatus experimental
 */
export default function RecordPage({ kind, recordId }: { kind: RecordKind; recordId: string }) {
  return <RecordMobilePage kind={kind} recordId={recordId} />;
}
