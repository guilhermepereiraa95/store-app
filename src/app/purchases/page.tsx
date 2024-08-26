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
  price: number; // Add price here
}

interface Product {
  name: string;
  price: string; // Keep price as string in Product interface
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0); // State for total spent
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
      let total = 0; // Variable to accumulate total spent

      for (const docSnap of purchasesSnapshot.docs) {
        const purchaseData = docSnap.data();
        const productRef = doc(db, "products", purchaseData.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data() as Product;
          const price = parseFloat(productData.price); // Convert price from string to number
          const amount = purchaseData.amount;
          const purchaseTotal = amount * price; // Calculate total for this purchase

          purchasesData.push({
            id: docSnap.id,
            productName: productData.name,
            date: (purchaseData.date as any).toDate(), // Convert Timestamp to Date
            amount,
            price,
          });

          total += purchaseTotal; // Add to total spent
        }
      }

      setPurchases(purchasesData);
      setTotalSpent(total); // Set the total spent
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
                const total = purchase.amount * purchase.price; // Calculate total
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
