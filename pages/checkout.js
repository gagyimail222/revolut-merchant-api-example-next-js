import fetch from "isomorphic-fetch";
import RevolutCheckout from '@revolut/checkout'
import Router from "next/router";
import Link from "next/link";
import { getData } from "country-list";

async function finishOrder(id) {
  const response = await fetch(`/api/orders/${id}/finish`, { method: "POST" });
  const order = await response.json();

  if (order.isCompleted) {
    Router.replace("/success");
  } else if (order.isFailed) {
    await renewOrder(id);
  } else {
    Router.replace(`/pending?order=${order.id}`);
  }
}

async function renewOrder(id) {
  const response = await fetch(`/api/orders/${id}/renew`, { method: "POST" });
  const order = await response.json();

  Router.replace(`/checkout?order=${order.id}`);
}

function CheckoutPage({ order }) {
  async function handleFormSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);
    const RC = await RevolutCheckout(order.token, 'sandbox');
    
    RC.revolutPay({
    target: document.getElementById('revolut-pay'),
    phone: '+441632960022', // recommended
    onSuccess() {
      console.log('Payment completed')
    },
    onError(error) {
      console.error('Payment failed: ' + error.message)
    }
  });
   
  }

  if (order === null) {
    return (
      <>
        <h2>
          <Link href="/">
            <a>Catalogue</a>
          </Link>
          {" / "}
          Checkout
        </h2>
        <h3>Order not found</h3>
      </>
    );
  }

  return (
    <>
      <div>Rev Pay?</div>
      <div id='revolut-pay'></div>
    </>
  );
}

export async function getServerSideProps({ query, req }) {
  const baseUrl = `http://${req.headers.host}`;

  const response = await fetch(`${baseUrl}/api/orders/${query.order}`);
  const order = response.ok ? await response.json() : null;

  return {
    props: {
      order
    }
  };
}

export default CheckoutPage;
