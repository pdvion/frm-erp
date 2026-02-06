"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
              <Input
                label="Código *"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />

              <div>
                <label className="text-theme-secondary mb-1 block text-sm font-medium">Tipo</label>
                <Select
                  value={type}
                  onChange={(value) => setType(value as typeof type)}
                  options={[
                    { value: "COMPANY", label: "Pessoa Jurídica" },
                    { value: "PERSON", label: "Pessoa Física" },
                  ]}
                />
              </div>

              {type === "COMPANY" ? (
                <Input
                  label="CNPJ"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              ) : (
                <Input
                  label="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              )}

              <div className="md:col-span-2">
                <Input
                  label={type === "COMPANY" ? "Razão Social *" : "Nome *"}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <Input
                label={type === "COMPANY" ? "Nome Fantasia" : "Apelido"}
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />

              {type === "COMPANY" && (
                <>
                  <Input
                    label="Inscrição Estadual"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                  />
                  <Input
                    label="Inscrição Municipal"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Contato</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Contato"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <Input
                label="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Celular"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />

              <Input
                label="Website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Endereço</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input
                label="CEP"
                value={addressZipCode}
                onChange={(e) => setAddressZipCode(e.target.value)}
              />

              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                />
              </div>

              <Input
                label="Número"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
              />

              <Input
                label="Complemento"
                value={addressComplement}
                onChange={(e) => setAddressComplement(e.target.value)}
              />

              <Input
                label="Bairro"
                value={addressNeighborhood}
                onChange={(e) => setAddressNeighborhood(e.target.value)}
              />

              <Input
                label="Cidade"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
              />

              <Input
                label="Estado"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                maxLength={2}
              />
            </div>
          </div>

          {/* Comercial */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Dados Comerciais</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Limite de Crédito"
                type="number"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="0,00"
              />

              <Input
                label="Prazo de Pagamento (dias)"
                type="number"
                value={paymentTermDays}
                onChange={(e) => setPaymentTermDays(e.target.value)}
              />

              <Input
                label="Valor Mínimo Fatura"
                type="number"
                step="0.01"
                value={minInvoiceValue}
                onChange={(e) => setMinInvoiceValue(e.target.value)}
                placeholder="0,00"
              />

              <Input
                label="Condição de Pagamento Padrão"
                value={defaultPaymentCondition}
                onChange={(e) => setDefaultPaymentCondition(e.target.value)}
                placeholder="Ex: 30/60/90"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Input
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
                <Input
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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
