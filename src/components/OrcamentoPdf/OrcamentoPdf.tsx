import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const brand = {
  bg: "#ffffff",
  bgCard: "#f8fafc",
  bgCardAlt: "#f1f5f9",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  sky: "#0284c7",
  skyLight: "#e0f2fe",
  skyBorder: "#7dd3fc",
  skyText: "#0369a1",
  green: "#15803d",
  greenLight: "#dcfce7",
  greenBorder: "#86efac",
  red: "#b91c1c",
  redLight: "#fee2e2",
  redBorder: "#fca5a5",
  amber: "#b45309",
  amberLight: "#fef3c7",
  amberBorder: "#fcd34d",
  gray: "#475569",
  grayLight: "#f8fafc",
  grayBorder: "#cbd5e1",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: brand.bg,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: brand.sky,
  },
  headerLeft: { flex: 1 },
  titulo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 10,
    color: brand.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    padding: 14,
  },
  cardLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 11,
    color: brand.text,
    marginBottom: 3,
  },
  cardValueMuted: {
    fontSize: 10,
    color: brand.textMuted,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderLight,
  },
  detailLabel: {
    fontSize: 10,
    color: brand.textMuted,
  },
  detailValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: brand.bgCardAlt,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  itemHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemIndex: {
    fontSize: 9,
    color: brand.textFaint,
    width: 16,
  },
  itemDescricao: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
  },
  itemValor: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
  },
  funcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderLight,
  },
  funcLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  funcAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: brand.skyLight,
    borderWidth: 1,
    borderColor: brand.skyBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  funcAvatarText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
  },
  funcName: {
    fontSize: 10,
    color: brand.text,
  },
  funcDetalhe: {
    fontSize: 9,
    color: brand.textMuted,
  },
  funcValor: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.textMuted,
  },
  breakdown: {
    flexDirection: "row",
    gap: 16,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: brand.bg,
  },
  breakdownItem: {
    flexDirection: "row",
    gap: 4,
  },
  breakdownLabel: {
    fontSize: 8,
    color: brand.textFaint,
  },
  breakdownValue: {
    fontSize: 8,
    color: brand.textMuted,
  },
  breakdownValueHighlight: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
  },
  obsCard: {
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  obsText: {
    fontSize: 10,
    color: brand.textMuted,
    lineHeight: 1.6,
  },
  totalCard: {
    backgroundColor: brand.skyLight,
    borderWidth: 1,
    borderColor: brand.skyBorder,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: brand.skyText,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValor: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalRightText: {
    fontSize: 9,
    color: brand.skyText,
    marginBottom: 2,
  },
  assinaturaSection: {
    flexDirection: "row",
    gap: 40,
    marginTop: 8,
  },
  assinaturaBox: {
    flex: 1,
    alignItems: "center",
  },
  assinaturaLinha: {
    width: "100%",
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    marginBottom: 8,
  },
  assinaturaLabel: {
    fontSize: 9,
    color: brand.text,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  assinaturaSubLabel: {
    fontSize: 8,
    color: brand.textFaint,
    textAlign: "center",
    marginTop: 2,
  },
  assinaturaTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: brand.borderLight,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: brand.textFaint,
  },
});

type FuncionarioData = {
  id: number;
  name: string;
  salario: number;
};

type ItemFuncionario = {
  id: string;
  horas: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
  orcamento_item_funcionarios: ItemFuncionario[];
};

type ClienteData = {
  nome: string;
  email: string | null;
  cpf_cnpj: string | null;
  logradouro: string | null;
  numero: string | null;
  cidade: string | null;
  estado: string | null;
};

type OrcamentoPDFProps = {
  numero: number | null;
  titulo: string;
  status: string;
  cliente: ClienteData | null;
  margem_lucro: number;
  aliquota_imposto: number;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  orcamento_itens: OrcamentoItem[];
  overheadPorHora: number;
  totalOrcamento: number;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusMap: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  rascunho: {
    label: "Rascunho",
    color: brand.gray,
    bg: brand.grayLight,
    border: brand.grayBorder,
  },
  enviado: {
    label: "Enviado",
    color: brand.sky,
    bg: brand.skyLight,
    border: brand.skyBorder,
  },
  aprovado: {
    label: "Aprovado",
    color: brand.green,
    bg: brand.greenLight,
    border: brand.greenBorder,
  },
  recusado: {
    label: "Recusado",
    color: brand.red,
    bg: brand.redLight,
    border: brand.redBorder,
  },
};

export function OrcamentoPDF({
  numero,
  titulo,
  status,
  cliente,
  margem_lucro,
  aliquota_imposto,
  validade_dias,
  observacoes,
  created_at,
  orcamento_itens,
  overheadPorHora,
  totalOrcamento,
}: OrcamentoPDFProps) {
  const st = statusMap[status] ?? statusMap.rascunho;
  const validade = new Date(created_at);
  validade.setDate(validade.getDate() + validade_dias);

  function calcularItem(item: OrcamentoItem) {
    const custoBase = item.orcamento_item_funcionarios.reduce((acc, f) => {
      const func = Array.isArray(f.funcionario_data)
        ? f.funcionario_data[0]
        : f.funcionario_data;
      if (!func) return acc;
      return acc + f.horas * (func.salario / 220 + overheadPorHora);
    }, 0);
    return {
      custoBase,
      comMargem: custoBase * (1 + margem_lucro),
      comImposto: custoBase * (1 + margem_lucro) * (1 + aliquota_imposto),
    };
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── CABEÇALHO DA EMPRESA ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Helvetica-Bold",
                color: brand.sky,
                letterSpacing: 3,
                marginBottom: 2,
              }}
            >
              GNOQ
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: brand.textFaint,
                letterSpacing: 1.5,
                marginBottom: 10,
              }}
            >
              GLOBAL NODE OF QUANTUM
            </Text>
            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              CNPJ: 57.738.857/0001-20
            </Text>
            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              Rua das Industrias, 500 — Novo Eldorado — Contagem/MG — CEP
              32341-490
            </Text>
            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              (31) 99452-5631 · gabriel.neves@gnoq.com.br
            </Text>
            <Text style={{ fontSize: 9, color: brand.sky }}>
              www.gnoq.com.br
            </Text>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              backgroundColor: brand.skyLight,
              borderWidth: 1,
              borderColor: brand.skyBorder,
              borderRadius: 8,
              padding: 14,
              minWidth: 150,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontFamily: "Helvetica-Bold",
                color: brand.textFaint,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Orçamento
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "Helvetica-Bold",
                color: brand.sky,
                marginBottom: 10,
              }}
            >
              #{String(numero ?? 0).padStart(4, "0")}
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: brand.skyBorder,
                paddingTop: 8,
                width: "100%",
                alignItems: "flex-end",
              }}
            >
              <Text
                style={{ fontSize: 8, color: brand.skyText, marginBottom: 3 }}
              >
                Data de emissão
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: brand.skyText,
                }}
              >
                {new Date().toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── TÍTULO E STATUS ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.subtitulo}>
              Válido até {validade.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* ── DADOS DO CLIENTE ── */}
        <View style={styles.infoRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Dados do cliente</Text>
            <Text style={styles.cardValue}>{cliente?.nome ?? "—"}</Text>
            {cliente?.cpf_cnpj && (
              <Text style={styles.cardValueMuted}>{cliente.cpf_cnpj}</Text>
            )}
            {cliente?.email && (
              <Text style={styles.cardValueMuted}>{cliente.email}</Text>
            )}
            {cliente?.logradouro && (
              <Text style={styles.cardValueMuted}>
                {cliente.logradouro}, {cliente.numero} — {cliente.cidade}/
                {cliente.estado}
              </Text>
            )}
          </View>
        </View>

        {/* ── ITENS ── */}
        <Text style={styles.sectionLabel}>Itens do orçamento</Text>
        {orcamento_itens.map((item, index) => {
          const calc = calcularItem(item);
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  <Text style={styles.itemIndex}>{index + 1}.</Text>
                  <Text style={styles.itemDescricao}>{item.descricao}</Text>
                </View>
                <Text style={styles.itemValor}>
                  {formatBRL(calc.comImposto)}
                </Text>
              </View>

              {/* {item.orcamento_item_funcionarios.map((f) => {
                const func = Array.isArray(f.funcionario_data)
                  ? f.funcionario_data[0]
                  : f.funcionario_data;
                const salarioPorHora = (func?.salario ?? 0) / 220;
                const custoFunc = f.horas * (salarioPorHora + overheadPorHora);
                return (
                  <View key={f.id} style={styles.funcRow}>
                    <View style={styles.funcLeft}>
                      <View style={styles.funcAvatar}>
                        <Text style={styles.funcAvatarText}>
                          {(func?.name ?? "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.funcName}>{func?.name ?? "—"}</Text>
                      <Text style={styles.funcDetalhe}>
                        · {f.horas}h ×{" "}
                        {formatBRL(salarioPorHora + overheadPorHora)}/h
                      </Text>
                    </View>
                    <Text style={styles.funcValor}>{formatBRL(custoFunc)}</Text>
                  </View>
                );
              })} */}

              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Custo base: </Text>
                  <Text style={styles.breakdownValue}>
                    {formatBRL(calc.custoBase)}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Com imposto: </Text>
                  <Text style={styles.breakdownValueHighlight}>
                    {formatBRL(calc.comImposto)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── TOTAL ── */}
        <View style={styles.totalCard} wrap={false}>
          <View>
            <Text style={styles.totalLabel}>Total do orçamento</Text>
            <Text style={styles.totalValor}>{formatBRL(totalOrcamento)}</Text>
          </View>
          <View style={styles.totalRight}>
            <Text style={styles.totalRightText}>
              Criado em {new Date(created_at).toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.totalRightText}>
              Válido até {validade.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* ── OBSERVAÇÕES / CONDIÇÕES DE PAGAMENTO ── */}
        {observacoes && (
          <View wrap={false} style={styles.obsCard}>
            <Text style={styles.cardLabel}>
              Condições de pagamento e observações
            </Text>
            <Text style={styles.obsText}>{observacoes}</Text>
          </View>
        )}

        {/* ── ASSINATURAS ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Assinaturas</Text>
        <View wrap={false} style={styles.assinaturaSection}>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>
              {cliente?.nome ?? "Contratante"}
            </Text>
            {cliente?.cpf_cnpj && (
              <Text style={styles.assinaturaSubLabel}>{cliente.cpf_cnpj}</Text>
            )}
            <Text style={styles.assinaturaSubLabel}>Contratante</Text>
          </View>

          <View style={styles.assinaturaBox}>
            {/* substituir pela imagem quando disponível:
            <Image src="/assinatura.png" style={{ width: 120, height: 48, objectFit: "contain" }} /> */}
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>
              GNOQ — Global Node of Quantum
            </Text>
            <Text style={styles.assinaturaSubLabel}>
              CNPJ: 57.738.857/0001-20
            </Text>
            <Text style={styles.assinaturaSubLabel}>Contratada</Text>
          </View>
        </View>

        {/* ── RODAPÉ DE PÁGINA ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>GNOQ — Global Node of Quantum</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
