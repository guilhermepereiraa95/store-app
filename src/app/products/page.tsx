'use client';
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";

interface Product {
  id: string;
  name: string;
  price: string;
  brand: string;
  category: string;
}

interface ProductFormInputs {
  name: string;
  price: string;
  brand: string;
  category: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState({ list: true, addUpdate: false, delete: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormInputs>();

  const fetchProducts = async () => {
    setLoading({ ...loading, list: true });
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      setProducts(productsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Product[]);
    } catch (error) {
      toast.error("Erro ao buscar produtos");
    } finally {
      setLoading({ ...loading, list: false });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct: SubmitHandler<ProductFormInputs> = async (data) => {
    setLoading({ ...loading, addUpdate: true });
    try {
      if (selectedProduct) {
        const productRef = doc(db, "products", selectedProduct.id);
        await updateDoc(productRef, data as Record<string, any>);
        toast.success("Produto atualizado com sucesso!");
        setSelectedProduct(null);
      } else {
        await addDoc(collection(db, "products"), data as Record<string, any>);
        toast.success("Produto adicionado com sucesso!");
      }

      fetchProducts();
      reset();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar produto");
    } finally {
      setLoading({ ...loading, addUpdate: false });
    }
  };

  const startUpdateProduct = (product: Product) => {
    setSelectedProduct(product);
    setValue("name", product.name);
    setValue("price", product.price);
    setValue("brand", product.brand);
    setValue("category", product.category);
    setIsModalOpen(true);
  };

  const cancelUpdate = () => {
    setSelectedProduct(null);
    reset();
    setIsModalOpen(false);
  };

  const deleteProduct = async (id: string) => {
    setLoading({ ...loading, delete: id });
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
      toast.success("Produto excluído com sucesso!");
      fetchProducts();
    } catch (error) {
      toast.error("Erro ao excluir produto");
    } finally {
      setLoading({ ...loading, delete: "" });
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Gerenciar Produtos</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar Produto por Nome, Preço, Marca ou Categoria"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSelectedProduct(null);
            reset();
          }}
          className="bg-green-500 text-white p-2 mb-6"
        >
          Adicionar Produto
        </button>

        {loading.list ? (
          <div className="flex justify-center">
            <ArrowPathIcon className="h-10 w-10 animate-spin text-gray-500" />
          </div>
        ) : (
          <ul>
            {filteredProducts.map((product) => (
              <li key={product.id} className="border p-4 mb-2 flex justify-between items-center">
                <span>
                  {product.name} - Preço: {product.price} - Marca: {product.brand} - Categoria: {product.category}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => startUpdateProduct(product)}
                    disabled={loading.addUpdate || loading.delete === product.id}
                    className="bg-yellow-500 text-white p-2 mr-2"
                  >
                    {loading.addUpdate && selectedProduct?.id === product.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Editar"
                    )}
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={loading.delete === product.id}
                    className="bg-red-500 text-white p-2 mr-2"
                  >
                    {loading.delete === product.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Excluir"
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Modal Usage */}
        <Modal
          isOpen={isModalOpen}
          onClose={cancelUpdate}
          title={selectedProduct ? "Editar Produto" : "Adicionar Produto"}
        >
          <form onSubmit={handleSubmit(addProduct)}>
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
                className={`border p-2 w-full ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Preço</label>
              <input
                type="text"
                placeholder="Preço do Produto"
                {...register("price", {
                  required: "Preço do produto é obrigatório",
                  pattern: {
                    value: /^[\d.,]+$/,
                    message: "Formato de preço inválido",
                  },
                })}
                className={`border p-2 w-full ${errors.price ? "border-red-500" : ""}`}
              />
              {errors.price && <p className="text-red-500 mt-1">{errors.price.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Marca</label>
              <input
                type="text"
                placeholder="Marca do Produto"
                {...register("brand", {
                  required: "Marca do produto é obrigatória",
                  minLength: {
                    value: 2,
                    message: "Marca deve ter no mínimo 2 caracteres",
                  },
                })}
                className={`border p-2 w-full ${errors.brand ? "border-red-500" : ""}`}
              />
              {errors.brand && <p className="text-red-500 mt-1">{errors.brand.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block mb-2">Categoria</label>
              <input
                type="text"
                placeholder="Categoria do Produto"
                {...register("category", {
                  required: "Categoria do produto é obrigatória",
                  minLength: {
                    value: 2,
                    message: "Categoria deve ter no mínimo 2 caracteres",
                  },
                })}
                className={`border p-2 w-full ${errors.category ? "border-red-500" : ""}`}
              />
              {errors.category && <p className="text-red-500 mt-1">{errors.category.message}</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={cancelUpdate}
                className="bg-gray-500 text-white p-2 mr-4"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.addUpdate}
                className="bg-green-500 text-white p-2"
              >
                {loading.addUpdate ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : selectedProduct ? "Atualizar" : "Adicionar"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </LayoutWrapper>
  );
}
