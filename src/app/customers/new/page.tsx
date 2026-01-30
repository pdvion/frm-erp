"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Users, Save } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [type, setType] = useState<"COMPANY" | "PERSON">("COMPANY");
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [stateRegistration, setStateRegistration] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [contactName, setContactName] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZipCode, setAddressZipCode] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState("30");
  const [notes, setNotes] = useState("");
  // Novos campos
  const [municipalRegistration, setMunicipalRegistration] = useState("");
  const [website, setWebsite] = useState("");
  const [minInvoiceValue, setMinInvoiceValue] = useState("");
  const [defaultPaymentCondition, setDefaultPaymentCondition] = useState("");
  const [applySt, setApplySt] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: (data) => {
      router.push(`/customers/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      code,
      type,
      companyName,
      tradeName: tradeName || undefined,
      cnpj: type === "COMPANY" ? cnpj || undefined : undefined,
      cpf: type === "PERSON" ? cpf || undefined : undefined,
      stateRegistration: stateRegistration || undefined,
      email: email || undefined,
      phone: phone || undefined,
      mobile: mobile || undefined,
      contactName: contactName || undefined,
      addressStreet: addressStreet || undefined,
      addressNumber: addressNumber || undefined,
      addressComplement: addressComplement || undefined,
      addressNeighborhood: addressNeighborhood || undefined,
      addressCity: addressCity || undefined,
      addressState: addressState || undefined,
      addressZipCode: addressZipCode || undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      paymentTermDays: paymentTermDays ? parseInt(paymentTermDays) : undefined,
      notes: notes || undefined,
      // Novos campos
      municipalRegistration: municipalRegistration || undefined,
      website: website || undefined,
      minInvoiceValue: minInvoiceValue ? parseFloat(minInvoiceValue) : undefined,
      defaultPaymentCondition: defaultPaymentCondition || undefined,
      applySt,
      isShared,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Cliente"
        subtitle="Cadastrar novo cliente"
        icon={<Users className="h-6 w-6" />}
        backHref="/customers"
        module="sales"
      />

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Identificação</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Código *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                >
                  <option value="COMPANY">Pessoa Jurídica</option>
                  <option value="PERSON">Pessoa Física</option>
                </select>
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  {type === "COMPANY" ? "CNPJ" : "CPF"}
                </label>
                {type === "COMPANY" ? (
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="border-theme-input w-full rounded-lg border px-3 py-2"
                  />
                ) : (
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="border-theme-input w-full rounded-lg border px-3 py-2"
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  {type === "COMPANY" ? "Razão Social" : "Nome"} *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  {type === "COMPANY" ? "Nome Fantasia" : "Apelido"}
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              {type === "COMPANY" && (
                <>
                  <div>
                    <label className="text-theme-secondary mb-1 block text-sm font-medium">
                      Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      value={stateRegistration}
                      onChange={(e) => setStateRegistration(e.target.value)}
                      className="border-theme-input w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-theme-secondary mb-1 block text-sm font-medium">
                      Inscrição Municipal
                    </label>
                    <input
                      type="text"
                      value={municipalRegistration}
                      onChange={(e) => setMunicipalRegistration(e.target.value)}
                      className="border-theme-input w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Contato</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Contato
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Telefone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Celular
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Endereço</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">CEP</label>
                <input
                  type="text"
                  value={addressZipCode}
                  onChange={(e) => setAddressZipCode(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Número
                </label>
                <input
                  type="text"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Complemento
                </label>
                <input
                  type="text"
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Bairro
                </label>
                <input
                  type="text"
                  value={addressNeighborhood}
                  onChange={(e) => setAddressNeighborhood(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Cidade
                </label>
                <input
                  type="text"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Estado
                </label>
                <input
                  type="text"
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  maxLength={2}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Comercial */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Dados Comerciais</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Limite de Crédito
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0,00"
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Prazo de Pagamento (dias)
                </label>
                <input
                  type="number"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Valor Mínimo Fatura
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={minInvoiceValue}
                  onChange={(e) => setMinInvoiceValue(e.target.value)}
                  placeholder="0,00"
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">
                  Condição de Pagamento Padrão
                </label>
                <input
                  type="text"
                  value={defaultPaymentCondition}
                  onChange={(e) => setDefaultPaymentCondition(e.target.value)}
                  placeholder="Ex: 30/60/90"
                  className="border-theme-input w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applySt"
                  checked={applySt}
                  onChange={(e) => setApplySt(e.target.checked)}
                  className="border-theme-input h-4 w-4 rounded text-blue-600"
                />
                <label htmlFor="applySt" className="text-theme-secondary text-sm">
                  Aplicar Substituição Tributária
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isShared"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="border-theme-input h-4 w-4 rounded text-blue-600"
                />
                <label htmlFor="isShared" className="text-theme-secondary text-sm">
                  Compartilhar com outras empresas
                </label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Observações</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-theme-input w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/customers">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!code || !companyName}
              isLoading={createMutation.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
