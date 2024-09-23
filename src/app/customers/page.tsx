'use client';
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from "../components/Modal";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  endereco: string;
}

interface CustomerFormInputs {
  name: string;
  email: string;
  phone: string;
  endereco: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState({ list: true, addUpdate: false, delete: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CustomerFormInputs>();

  const fetchCustomers = async () => {
    setLoading({ ...loading, list: true });
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      setCustomers(customersSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Customer[]);
    } catch (error) {
      toast.error("Erro ao buscar clientes");
    } finally {
      setLoading({ ...loading, list: false });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer: SubmitHandler<CustomerFormInputs> = async (data) => {
    setLoading({ ...loading, addUpdate: true });
    try {
      if (selectedCustomer) {
        const customerRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerRef, data as Record<string, any>);
        toast.success("Cliente atualizado com sucesso!");
        setSelectedCustomer(null);
      } else {
        await addDoc(collection(db, "customers"), data as Record<string, any>);
        toast.success("Cliente adicionado com sucesso!");
      }

      fetchCustomers();
      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar cliente");
    } finally {
      setLoading({ ...loading, addUpdate: false });
    }
  };

  const startUpdateCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue("name", customer.name);
    setValue("email", customer.email);
    setValue("phone", customer.phone);
    setValue("endereco", customer.endereco);
    setIsModalOpen(true);
  };

  const cancelUpdate = () => {
    setSelectedCustomer(null);
    reset();
    setIsModalOpen(false);
  };

  const deleteCustomer = async (id: string) => {
    setLoading({ ...loading, delete: id });
    try {
      const customerRef = doc(db, "customers", id);
      await deleteDoc(customerRef);
      toast.success("Cliente excluído com sucesso!");
      fetchCustomers();
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    } finally {
      setLoading({ ...loading, delete: "" });
    }
  };

  const viewCustomerPurchases = (customerId: string) => {
    router.push(`/purchases?customerId=${customerId}`);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Gerenciar Clientes</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar Cliente por Nome, Email, Telefone ou Endereço"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSelectedCustomer(null);
            reset();
          }}
          className="bg-green-500 text-white p-2 mb-6"
        >
          Adicionar Cliente
        </button>

        {loading.list ? (
          <div className="flex justify-center">
            <ArrowPathIcon className="h-10 w-10 animate-spin text-gray-500" />
          </div>
        ) : (
          <ul>
            {filteredCustomers.map((customer) => (
              <li
                key={customer.id}
                className="border p-4 mb-2 flex justify-between items-center"
              >
                <span>
                  {customer.name} - Email: {customer.email} - Telefone: {customer.phone} - Endereço: {customer.endereco}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => startUpdateCustomer(customer)}
                    disabled={loading.addUpdate || loading.delete === customer.id}
                    className="bg-yellow-500 text-white p-2 mr-2"
                  >
                    {loading.addUpdate && selectedCustomer?.id === customer.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Editar"
                    )}
                  </button>
                  <button
                    onClick={() => deleteCustomer(customer.id)}
                    disabled={loading.delete === customer.id}
                    className="bg-red-500 text-white p-2 mr-2"
                  >
                    {loading.delete === customer.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Excluir"
                    )}
                  </button>
                  <button
                    onClick={() => viewCustomerPurchases(customer.id)}
                    className="bg-blue-500 text-white p-2"
                  >
                    Ver Compras
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={cancelUpdate}
          title={selectedCustomer ? "Editar Cliente" : "Adicionar Cliente"}
        >
          <form onSubmit={handleSubmit(addCustomer)}>
            <div className="mb-4">
              <label className="block mb-2">Nome do Cliente</label>
              <input
                type="text"
                placeholder="Nome do Cliente"
                {...register("name", {
                  required: "Nome do cliente é obrigatório",
                  minLength: {
                    value: 2,
                    message: "Nome deve ter no mínimo 2 caracteres",
                  },
                })}
                className={`border p-2 w-full ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input
                type="text"
                placeholder="Email do Cliente"
                {...register("email", {
                  required: "Email do cliente é obrigatório",
                  pattern: {
                    value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                    message: "Formato de email inválido",
                  },
                })}
                className={`border p-2 w-full ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Telefone</label>
              <input
                type="text"
                placeholder="Telefone do Cliente"
                {...register("phone", {
                  required: "Telefone do cliente é obrigatório",
                })}
                className={`border p-2 w-full ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && <p className="text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Endereço</label>
              <input
                type="text"
                placeholder="Endereço do Cliente"
                {...register("endereco", {
                  required: "Endereço do cliente é obrigatório",
                })}
                className={`border p-2 w-full ${errors.endereco ? "border-red-500" : ""}`}
              />
              {errors.endereco && <p className="text-red-500 mt-1">{errors.endereco.message}</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={cancelUpdate}
                className="bg-gray-500 text-white p-2 mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.addUpdate}
                className="bg-blue-500 text-white p-2"
              >
                {loading.addUpdate ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </LayoutWrapper>
  );
}
