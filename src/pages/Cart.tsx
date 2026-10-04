import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { getCartTotal } from '../data/commerce'
import { getService } from '../data/services'
import IconGlyph from '../components/IconGlyph'

export default function Cart() {
  const { cart, setCartQuantity, removeFromCart } = useCommerce()
  const total = getCartTotal(cart, (id) => getService(id))

  return (
    <div className="flow-page container">
      <div className="flow-heading"><span className="section-kicker">YOUR EVERYDAY ESSENTIALS</span><h1>Your bag</h1><p>Review your products before checkout.</p></div>
      {cart.length ? <div className="cart-layout">
        <div className="cart-lines">{cart.map((line) => {
          const product = getService(line.serviceId)
          if (!product) return null
          return <article className="cart-line" key={line.serviceId}>
            <div className={`cart-product-art art-${product.tone}`}><IconGlyph name={product.icon} size={28} /></div>
            <div className="cart-product-info"><Link to={`/service/${product.id}`}>{product.name}</Link><span>₹{product.price.toLocaleString('en-IN')} · {product.priceUnit}</span><div className="quantity-control"><button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => setCartQuantity(product.id, line.quantity - 1)}><Minus size={13} /></button><span>{line.quantity}</span><button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => setCartQuantity(product.id, line.quantity + 1)}><Plus size={13} /></button></div></div>
            <strong className="cart-line-total">₹{(product.price * line.quantity).toLocaleString('en-IN')}</strong>
            <button className="icon-button remove-line" type="button" aria-label={`Remove ${product.name}`} onClick={() => removeFromCart(product.id)}><Trash2 size={16} /></button>
          </article>
        })}</div>
        <aside className="flow-summary"><span className="section-kicker">ORDER SUMMARY</span><h2>Almost yours.</h2><div className="summary-row"><span>Items ({cart.reduce((sum, line) => sum + line.quantity, 0)})</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><div className="summary-row"><span>Delivery</span><strong className="free-delivery">To be confirmed</strong></div><div className="summary-total"><span>Subtotal</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><Link className="button button-primary full-button" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link><p className="summary-note">Checkout is a demo flow. No payment will be processed.</p></aside>
      </div> : <div className="empty-state flow-empty"><span><ShoppingBag size={23} /></span><h2>Your bag is taking a breather.</h2><p>Explore the essentials and add something useful for your day.</p><Link className="button button-primary" to="/categories">Explore essentials <ArrowRight size={15} /></Link></div>}
    </div>
  )
}
