import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  invoiceNumber: { fontSize: 14, color: '#666', fontFamily: 'Courier' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  column: { flex: 1 },
  label: { fontSize: 9, color: '#666', marginBottom: 4 },
  value: { fontSize: 10, fontWeight: 'bold' },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#000', paddingBottom: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tableColDesc: { flex: 3 },
  tableColQty: { flex: 1, textAlign: 'right' },
  tableColPrice: { flex: 1, textAlign: 'right' },
  tableColTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 20, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingVertical: 4 },
  totalsFinalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingVertical: 8, borderTopWidth: 2, borderColor: '#000', marginTop: 4 },
  paymentTerms: { marginTop: 30, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 4 },
  paymentInstructions: { marginTop: 20, padding: 12, backgroundColor: '#dbeafe', borderRadius: 4 },
  paidWatermark: { position: 'absolute', top: 300, left: 100, fontSize: 80, color: '#10b981', opacity: 0.1, transform: 'rotate(-45deg)' },
});

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: string;
    subtotal: number;
    vat_amount: number;
    total_amount: number;
    payment_terms: string | null;
    customer: {
      company_name: string | null;
      contact_name: string;
      email: string | null;
      address: string | null;
    };
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
  };
  companyName?: string;
  companyIBAN?: string;
}

export function InvoicePDF({ invoice, companyName = 'Uw Bedrijf', companyIBAN }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {invoice.status === 'paid' && (
          <Text style={styles.paidWatermark}>BETAALD</Text>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>FACTUUR</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Aan:</Text>
            <Text style={styles.value}>{invoice.customer.company_name || invoice.customer.contact_name}</Text>
            {invoice.customer.company_name && <Text>{invoice.customer.contact_name}</Text>}
            {invoice.customer.email && <Text>{invoice.customer.email}</Text>}
            {invoice.customer.address && <Text>{invoice.customer.address}</Text>}
          </View>

          <View style={styles.column}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Factuurdatum:</Text>
              <Text style={styles.value}>{new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={styles.label}>Vervaldatum:</Text>
              <Text style={styles.value}>{new Date(invoice.due_date).toLocaleDateString('nl-NL')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColDesc}>Omschrijving</Text>
            <Text style={styles.tableColQty}>Aantal</Text>
            <Text style={styles.tableColPrice}>Prijs</Text>
            <Text style={styles.tableColTotal}>Totaal</Text>
          </View>

          {invoice.line_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableColDesc}>{item.description}</Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColPrice}>€{item.unit_price.toFixed(2)}</Text>
              <Text style={styles.tableColTotal}>€{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Subtotaal</Text>
            <Text>€{invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>BTW (21%)</Text>
            <Text>€{invoice.vat_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsFinalRow}>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Totaal</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>€{invoice.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {invoice.payment_terms && (
          <View style={styles.paymentTerms}>
            <Text style={{ fontSize: 9, marginBottom: 4, fontWeight: 'bold' }}>Betalingsvoorwaarden:</Text>
            <Text style={{ fontSize: 9 }}>{invoice.payment_terms}</Text>
          </View>
        )}

        {companyIBAN && invoice.status !== 'paid' && (
          <View style={styles.paymentInstructions}>
            <Text style={{ fontSize: 9, marginBottom: 4, fontWeight: 'bold' }}>Betaalinstructies:</Text>
            <Text style={{ fontSize: 9, marginBottom: 2 }}>IBAN: {companyIBAN}</Text>
            <Text style={{ fontSize: 9 }}>Onder vermelding van: {invoice.invoice_number}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(invoice: InvoicePDFProps['invoice'], companyName?: string, companyIBAN?: string) {
  const blob = await pdf(<InvoicePDF invoice={invoice} companyName={companyName} companyIBAN={companyIBAN} />).toBlob();
  return blob;
}
