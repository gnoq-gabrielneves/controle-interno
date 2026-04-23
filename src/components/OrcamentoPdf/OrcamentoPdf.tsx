// src/components/OrcamentoPDF/OrcamentoPDF.tsx
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
    paddingBottom: 80, // espaço pro total fixo no rodapé
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
  },

  // cabeçalho
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
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

  // cards de info
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

  // seção de itens
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

  // funcionários do item
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

  // breakdown do item
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

  // observações
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

  // total — fixo no rodapé
  totalCard: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: brand.skyLight,
    borderWidth: 1,
    borderColor: brand.skyBorder,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  // rodapé de página
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
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
        {/* cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.subtitulo}>
              {cliente?.nome ?? "—"} · Válido até{" "}
              {validade.toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: st.bg, borderColor: st.border },
            ]}
          >
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
        </View>

        {/* cliente + detalhes */}
        <View style={styles.infoRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cliente</Text>
            <Text style={styles.cardValue}>{cliente?.nome ?? "—"}</Text>
            {cliente?.email && (
              <Text style={styles.cardValueMuted}>{cliente.email}</Text>
            )}
            {cliente?.cpf_cnpj && (
              <Text style={styles.cardValueMuted}>{cliente.cpf_cnpj}</Text>
            )}
            {cliente?.logradouro && (
              <Text style={styles.cardValueMuted}>
                {cliente.logradouro}, {cliente.numero} — {cliente.cidade}/
                {cliente.estado}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Detalhes financeiros</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Margem de lucro</Text>
              <Text style={styles.detailValue}>
                {(margem_lucro * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Alíquota imposto</Text>
              <Text style={styles.detailValue}>
                {(aliquota_imposto * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Overhead/hora</Text>
              <Text style={styles.detailValue}>
                {formatBRL(overheadPorHora)}
              </Text>
            </View>
            <View
              style={[
                styles.detailRow,
                { borderBottomWidth: 0, marginBottom: 0 },
              ]}
            >
              <Text style={styles.detailLabel}>Validade</Text>
              <Text style={styles.detailValue}>
                {validade.toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>
        </View>

        {/* itens */}
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

              {item.orcamento_item_funcionarios.map((f) => {
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
              })}

              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Custo base: </Text>
                  <Text style={styles.breakdownValue}>
                    {formatBRL(calc.custoBase)}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Com margem: </Text>
                  <Text style={styles.breakdownValue}>
                    {formatBRL(calc.comMargem)}
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

        {/* observações */}
        {observacoes && (
          <View style={styles.obsCard}>
            <Text style={styles.cardLabel}>Observações</Text>
            <Text style={styles.obsText}>{observacoes}</Text>
          </View>
        )}

        {/* total — sempre no rodapé via position absolute */}
        <View style={styles.totalCard} fixed>
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

        {/* rodapé de página */}
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
