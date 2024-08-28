'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Purchase {
  id: string;
  productName: string;
  date: Date;
  amount: number;
  price: number;
}

interface Product {
  name: string;
  price: string;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const router = useRouter(); 

  useEffect(() => {
    const fetchPurchases = async () => {
      const customerId = new URLSearchParams(window.location.search).get("customerId");
      if (!customerId) {
        router.push("/customers");
        return;
      }

      const q = query(collection(db, "sales"), where("customerId", "==", customerId));
      const purchasesSnapshot = await getDocs(q);
      const purchasesData: Purchase[] = [];
      let total = 0; 

      for (const docSnap of purchasesSnapshot.docs) {
        const purchaseData = docSnap.data();
        const productRef = doc(db, "products", purchaseData.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data() as Product;
          const price = parseFloat(productData.price);
          const amount = purchaseData.amount;
          const purchaseTotal = amount * price;

          purchasesData.push({
            id: docSnap.id,
            productName: productData.name,
            date: (purchaseData.date as any).toDate(), 
            amount,
            price,
          });

          total += purchaseTotal; 
        }
      }

      setPurchases(purchasesData);
      setTotalSpent(total); 
      setLoading(false);
    };

    fetchPurchases();
  }, [router]);

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-6">
          <ArrowPathIcon className="h-10 w-10 animate-spin mx-auto" />
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Compras do Cliente</h1>
        {purchases.length === 0 ? (
          <p>Nenhuma compra encontrada para este cliente.</p>
        ) : (
          <>
            <p className="text-lg mb-4">Total gasto: R$ {totalSpent.toFixed(2)}</p>
            <ul>
              {purchases.map((purchase) => {
                const total = purchase.amount * purchase.price;
                return (
                  <li
                    key={purchase.id}
                    className="border p-4 mb-2 flex justify-between items-center"
                  >
                    <span>
                      Produto: {purchase.productName} - Data da Compra: {purchase.date.toLocaleDateString()} - Quantidade: {purchase.amount} - Total: R$ {total.toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
