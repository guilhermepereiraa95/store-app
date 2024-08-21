"use client";
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
import { ArrowPathIcon } from "@heroicons/react/24/solid";

interface Produto {
  id: string;
  name: string;
  price: number;
  amount: number;
}

interface ProdutoFormInputs {
  name: string;
  price: number;
  amount: number;
}

export default function Products() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProdutoFormInputs>();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const productsRef = collection(db, "products");
      const productsSnapshot = await getDocs(productsRef);
      const productsList = productsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Produto[];
      setProducts(productsList);
      setIsLoading(false);
    } catch (error) {
      toast.error("Erro ao buscar produtos:");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduto: SubmitHandler<ProdutoFormInputs> = async (data) => {
    try {
      setIsLoading(true);
      if (editingProductId) {
        const produtoRef = doc(db, "products", editingProductId);
        await updateDoc(produtoRef, data as Record<string, any>);
        toast.success("Produto atualizado com sucesso!");
        setEditingProductId(null);
      } else {
        await addDoc(collection(db, "products"), data as Record<string, any>);
        toast.success("Produto adicionado com sucesso!");
      }
      reset();
      fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar produto:");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      setDeletingProductId(id);
      const produtoRef = doc(db, "products", id);
      await deleteDoc(produtoRef);
      toast.success("Produto excluído com sucesso!");
      fetchProducts();
    } catch (error) {
      toast.error("Erro ao excluir produto:");
    } finally {
      setDeletingProductId(null);
    }
  };

  const editProduto = (produto: Produto) => {
    setEditingProductId(produto.id);
    setValue("name", produto.name);
    setValue("price", produto.price);
    setValue("amount", produto.amount);
    setIsModalOpen(true); // Open the modal when editing a product
  };

  const filteredProducts = products.filter((produto) =>
    produto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Gerenciar produtos</h1>

        {/* Search Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar Produto por Nome"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* Button to open modal for adding a new product */}
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingProductId(null);
            reset();
          }}
          className="bg-green-500 text-white p-2 mb-6"
        >
          Adicionar Produto
        </button>

        {/* List of products */}
        <ul>
          {filteredProducts.map((produto) => (
            <li
              key={produto.id}
              className="border p-4 mb-2 flex justify-between items-center"
            >
              <span>
                {produto.name} - R${produto.price.toFixed(2)} - Quantidade:{" "}
                {produto.amount}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editProduto(produto)}
                  className="bg-yellow-500 text-white p-2 flex items-center justify-center"
                >
                  {isLoading && editingProductId === produto.id ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    "Editar"
                  )}
                </button>
                <button
                  onClick={() => deleteProduto(produto.id)}
                  className="bg-red-500 text-white p-2 flex items-center justify-center"
                >
                  {deletingProductId === produto.id ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    "Excluir"
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Modal for Add/Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-xl mb-4">
                {editingProductId ? "Editar Produto" : "Adicionar Produto"}
              </h2>
              <form onSubmit={handleSubmit(addProduto)}>
                <div className="mb-4">
                  <label className="block mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    placeholder="Nome do Produto"
                    {...register("name", {
                      required: "Nome do produto é obrigatório",
                      minLength: {
                        value: 2,
                        message: "Nome deve ter no mínimo 2 caracteres",
                      },
                    })}
                    className={`border p-2 w-full ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Preço</label>
                  <input
                    type="number"
                    placeholder="Preço"
                    {...register("price", {
                      required: "Preço do produto é obrigatório",
                      valueAsNumber: true,
                      min: { value: 0.01, message: "Preço deve ser maior que zero" },
                    })}
                    className={`border p-2 w-full ${
                      errors.price ? "border-red-500" : ""
                    }`}
                  />
                  {errors.price && (
                    <p className="text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Quantidade</label>
                  <input
                    type="number"
                    placeholder="Quantidade"
                    {...register("amount", {
                      required: "Quantidade é obrigatória",
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Quantidade deve ser maior que zero",
                      },
                    })}
                    className={`border p-2 w-full ${
                      errors.amount ? "border-red-500" : ""
                    }`}
                  />
                  {errors.amount && (
                    <p className="text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white p-2 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : editingProductId ? (
                      "Atualizar Produto"
                    ) : (
                      "Adicionar Produto"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingProductId(null);
                      reset();
                    }}
                    className="bg-gray-500 text-white p-2"
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
