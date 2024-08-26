"use client";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Venda {
  id: string;
  productId: string;
  amount: number;
  date: Timestamp;
  customerId: string; // Added to include the customer ID in the sale
}

interface Produto {
  id: string;
  name: any;
  price: number; // Added price to calculate the total amount
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface VendaFormInputs {
  productId: string;
  amount: number;
  date: string;
  customerId: string; // Added for selecting the customer
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]); // Added state for customers
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VendaFormInputs>();

  useEffect(() => {
    const fetchVendas = async () => {
      setLoading(true);
      const vendasSnapshot = await getDocs(collection(db, "sales"));
      setVendas(
        vendasSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          date: doc.data().date as Timestamp,
        })) as Venda[]
      );
      setLoading(false);
    };

    const fetchProdutos = async () => {
      const produtosSnapshot = await getDocs(collection(db, "products"));
      setProdutos(
        produtosSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Produto[]
      );
    };

    const fetchCustomers = async () => {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      setCustomers(
        customersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Customer[]
      );
    };

    fetchVendas();
    fetchProdutos();
    fetchCustomers(); // Fetch customers data
  }, []);

  const addVenda: SubmitHandler<VendaFormInputs> = async (data) => {
    try {
      const vendaData = {
        ...data,
        date: Timestamp.fromDate(new Date(data.date)),
      };

      setLoading(true);

      if (selectedVenda) {
        const vendaRef = doc(db, "sales", selectedVenda.id);
        await updateDoc(vendaRef, vendaData);
        toast.success("Venda atualizada com sucesso!");

        setVendas((prevVendas) =>
          prevVendas.map((venda) =>
            venda.id === selectedVenda.id
              ? { ...venda, ...vendaData, date: vendaData.date }
              : venda
          )
        );

        setSelectedVenda(null);
      } else {
        const vendaRef = await addDoc(collection(db, "sales"), vendaData);
        toast.success("Venda adicionada com sucesso!");

        setVendas((prevVendas) => [
          ...prevVendas,
          { id: vendaRef.id, ...vendaData },
        ]);
      }

      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar venda");
    } finally {
      setLoading(false);
    }
  };

  const startUpdateVenda = (venda: Venda) => {
    setSelectedVenda(venda);
    setValue("productId", venda.productId);
    setValue("amount", venda.amount);
    setValue("date", venda.date.toDate().toISOString().split("T")[0]);
    setValue("customerId", venda.customerId); // Set the customer ID when editing
    setIsModalOpen(true); // Open the modal when editing a sale
  };

  const cancelUpdate = () => {
    setSelectedVenda(null);
    reset();
    setIsModalOpen(false);
  };

  const deleteVenda = async (id: string) => {
    try {
      setLoading(true);
      const vendaRef = doc(db, "sales", id);
      await deleteDoc(vendaRef);
      toast.success("Venda excluída com sucesso!");

      setVendas((prevVendas) => prevVendas.filter((venda) => venda.id !== id));
    } catch (error) {
      toast.error("Erro ao excluir venda");
    } finally {
      setLoading(false);
    }
  };

  const getProdutoNome = (productId: string) => {
    const produto = produtos.find((p) => p.id === productId);
    return produto ? produto.name : "Produto desconhecido";
  };

  const getProdutoPreco = (productId: string) => {
    const produto = produtos.find((p) => p.id === productId);
    return produto ? produto.price : 0;
  };

  const getCustomerNome = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente desconhecido";
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  };

  // Calculate total amount spent for each sale
  const calculateTotalAmount = (productId: string, amount: number) => {
    const price = getProdutoPreco(productId);
    return (price * amount).toFixed(2);
  };

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Gerenciar Vendas</h1>
        
        <button
          onClick={() => {
            setIsModalOpen(true);
            setSelectedVenda(null);
            reset({
              date: new Date().toISOString().split("T")[0], // Set default date to today
            });
          }}
          className="bg-green-500 text-white p-2 mb-6"
        >
          Registrar Venda
        </button>

        <ul>
          {loading ? (
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto" />
          ) : (
            vendas.map((venda) => (
              <li
                key={venda.id}
                className="border p-4 mb-2 flex justify-between items-center"
              >
                <span>
                  {getProdutoNome(venda.productId)} - Quantidade: {venda.amount}{" "}
                  - Data: {formatDate(venda.date)} - Cliente: {getCustomerNome(venda.customerId)}{" "}
                  - Total: R${calculateTotalAmount(venda.productId, venda.amount)}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startUpdateVenda(venda)}
                    className="bg-yellow-500 text-white p-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteVenda(venda.id)}
                    className="bg-red-500 text-white p-2"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Modal for Add/Edit Sale */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-xl mb-4">
                {selectedVenda ? "Editar Venda" : "Registrar Venda"}
              </h2>
              <form onSubmit={handleSubmit(addVenda)}>
                <div className="mb-4">
                  <label className="block mb-2">Produto</label>
                  <select
                    {...register("productId", { required: "Produto é obrigatório" })}
                    className={`border p-2 w-full ${
                      errors.productId ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Selecione o Produto</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.name}
                      </option>
                    ))}
                  </select>
                  {errors.productId && (
                    <p className="text-red-500 mt-1">
                      {errors.productId.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Cliente</label>
                  <select
                    {...register("customerId", { required: "Cliente é obrigatório" })}
                    className={`border p-2 w-full ${
                      errors.customerId ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Selecione o Cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="text-red-500 mt-1">
                      {errors.customerId.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Quantidade</label>
                  <input
                    type="number"
                    placeholder="Quantidade"
                    {...register("amount", {
                      required: "Quantidade é obrigatória",
                      min: { value: 1, message: "Quantidade deve ser maior que 0" },
                    })}
                    className={`border p-2 w-full ${
                      errors.amount ? "border-red-500" : ""
                    }`}
                  />
                  {errors.amount && (
                    <p className="text-red-500 mt-1">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Data</label>
                  <input
                    type="date"
                    {...register("date", { required: "Data é obrigatória" })}
                    className={`border p-2 w-full ${
                      errors.date ? "border-red-500" : ""
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-500 mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 w-32"
                    disabled={loading}
                  >
                    {loading ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                    ) : selectedVenda ? (
                      "Atualizar"
                    ) : (
                      "Adicionar"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelUpdate}
                    className="bg-gray-500 text-white p-2 w-32"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
