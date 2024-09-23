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
import Modal from "../components/Modal";

interface Venda {
  id: string;
  productId: string;
  amount: number;
  date: Timestamp;
  customerId: string;
}

interface Produto {
  id: string;
  name: string;
  price: number;
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
  customerId: string;
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState({ list: false, addUpdate: false, delete: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VendaFormInputs>();

  const fetchVendas = async () => {
    setLoading(prev => ({ ...prev, list: true }));
    try {
      const vendasSnapshot = await getDocs(collection(db, "sales"));
      setVendas(
        vendasSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          date: doc.data().date as Timestamp,
        })) as Venda[]
      );
    } catch (error) {
      toast.error("Erro ao buscar vendas");
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  };

  const fetchProdutos = async () => {
    try {
      const produtosSnapshot = await getDocs(collection(db, "products"));
      setProdutos(
        produtosSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Produto[]
      );
    } catch (error) {
      toast.error("Erro ao buscar produtos");
    }
  };

  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      setCustomers(
        customersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Customer[]
      );
    } catch (error) {
      toast.error("Erro ao buscar clientes");
    }
  };

  useEffect(() => {
    fetchVendas();
    fetchProdutos();
    fetchCustomers();
  }, []);

  const addVenda: SubmitHandler<VendaFormInputs> = async (data) => {
    setLoading(prev => ({ ...prev, addUpdate: true }));
    try {
      const vendaData = {
        ...data,
        date: Timestamp.fromDate(new Date(data.date)),
      };

      if (selectedVenda) {
        const vendaRef = doc(db, "sales", selectedVenda.id);
        await updateDoc(vendaRef, vendaData);
        toast.success("Venda atualizada com sucesso!");
        setVendas(prevVendas =>
          prevVendas.map(venda =>
            venda.id === selectedVenda.id
              ? { ...venda, ...vendaData, date: vendaData.date }
              : venda
          )
        );
        setSelectedVenda(null);
      } else {
        const vendaRef = await addDoc(collection(db, "sales"), vendaData);
        toast.success("Venda adicionada com sucesso!");
        setVendas(prevVendas => [
          ...prevVendas,
          { id: vendaRef.id, ...vendaData },
        ]);
      }

      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar venda");
    } finally {
      setLoading(prev => ({ ...prev, addUpdate: false }));
    }
  };

  const startUpdateVenda = (venda: Venda) => {
    setSelectedVenda(venda);
    setValue("productId", venda.productId);
    setValue("amount", venda.amount);
    setValue("date", venda.date.toDate().toISOString().split("T")[0]);
    setValue("customerId", venda.customerId);
    setIsModalOpen(true);
  };

  const cancelUpdate = () => {
    setSelectedVenda(null);
    reset();
    setIsModalOpen(false);
  };

  const deleteVenda = async (id: string) => {
    setLoading(prev => ({ ...prev, delete: id }));
    try {
      const vendaRef = doc(db, "sales", id);
      await deleteDoc(vendaRef);
      toast.success("Venda excluída com sucesso!");
      setVendas(prevVendas => prevVendas.filter(venda => venda.id !== id));
    } catch (error) {
      toast.error("Erro ao excluir venda");
    } finally {
      setLoading(prev => ({ ...prev, delete: "" }));
    }
  };

  const getProdutoNome = (productId: string) => {
    const produto = produtos.find(p => p.id === productId);
    return produto ? produto.name : "Produto desconhecido";
  };

  const getProdutoPreco = (productId: string) => {
    const produto = produtos.find(p => p.id === productId);
    return produto ? produto.price : 0;
  };

  const getCustomerNome = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Cliente desconhecido";
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString();
  };

  const calculateTotalAmount = (productId: string, amount: number) => {
    const price = getProdutoPreco(productId);
    return (price * amount).toFixed(2);
  };

  const filteredVendas = vendas.filter(venda => {
    const productName = getProdutoNome(venda.productId).toLowerCase();
    const customerName = getCustomerNome(venda.customerId).toLowerCase();
    return (
      productName.includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Gerenciar Vendas</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar Venda por Produto ou Cliente"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSelectedVenda(null);
            reset({ date: new Date().toISOString().split("T")[0] });
          }}
          className="bg-green-500 text-white p-2 mb-6"
        >
          Registrar Venda
        </button>

        <ul>
          {loading.list ? (
            <div className="flex justify-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            filteredVendas.map(venda => (
              <li key={venda.id} className="border p-4 mb-2 flex justify-between items-center">
                <span>
                  {getProdutoNome(venda.productId)} - Quantidade: {venda.amount} - Data: {formatDate(venda.date)} - Cliente: {getCustomerNome(venda.customerId)} - Total: R$ {calculateTotalAmount(venda.productId, venda.amount)}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startUpdateVenda(venda)}
                    disabled={loading.addUpdate}
                    className="bg-yellow-500 text-white p-2"
                  >
                    {loading.addUpdate && selectedVenda?.id === venda.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Editar"
                    )}
                  </button>
                  <button
                    onClick={() => deleteVenda(venda.id)}
                    disabled={loading.delete === venda.id}
                    className="bg-red-500 text-white p-2"
                  >
                    {loading.delete === venda.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Excluir"
                    )}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <Modal
          isOpen={isModalOpen}
          onClose={cancelUpdate}
          title={selectedVenda ? "Editar Venda" : "Adicionar Venda"}
        >
          <form onSubmit={handleSubmit(addVenda)}>
            <div className="mb-4">
              <label className="block">Produto</label>
              <select {...register("productId", { required: true })} className="border p-2 w-full">
                <option value="">Selecione um produto</option>
                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.name}
                  </option>
                ))}
              </select>
              {errors.productId && <p className="text-red-500">Produto é obrigatório</p>}
            </div>
            <div className="mb-4">
              <label className="block">Quantidade</label>
              <input
                type="number"
                {...register("amount", { required: true })}
                className="border p-2 w-full"
              />
              {errors.amount && <p className="text-red-500">Quantidade é obrigatória</p>}
            </div>
            <div className="mb-4">
              <label className="block">Data</label>
              <input
                type="date"
                {...register("date", { required: true })}
                className="border p-2 w-full"
              />
              {errors.date && <p className="text-red-500">Data é obrigatória</p>}
            </div>
            <div className="mb-4">
              <label className="block">Cliente</label>
              <select {...register("customerId", { required: true })} className="border p-2 w-full">
                <option value="">Selecione um cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="text-red-500">Cliente é obrigatório</p>}
            </div>
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={cancelUpdate} className="bg-gray-500 text-white p-2">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.addUpdate}
                className="bg-blue-500 text-white p-2"
              >
                {loading.addUpdate ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </LayoutWrapper>
  );
}
