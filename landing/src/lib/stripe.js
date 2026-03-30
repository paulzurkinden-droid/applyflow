/**
 * ApplyFlow — Stripe Payment Links helper
 *
 * BUG-001 fix: Replaced deprecated stripe.redirectToCheckout({ lineItems, mode })
 * with Stripe Payment Links (static URLs from Stripe Dashboard).
 *
 * BUG-002 fix: All redirects are wrapped in try/catch with user-facing error messages.
 *
 * Configure in Stripe Dashboard:
 *   - Create a Payment Link for each plan
 *   - Set the success URL to: https://your-domain.com/merci
 *   - Copy the payment link URL into your .env file
 */

export function redirectToPaymentLink(paymentLinkUrl) {
  try {
    if (!paymentLinkUrl) {
      throw new Error('Lien de paiement non configuré — variable d\'environnement manquante.');
    }
    window.location.href = paymentLinkUrl;
  } catch (err) {
    console.error('[ApplyFlow Stripe]', err);
    alert(
      'Une erreur est survenue lors de la redirection vers le paiement.\n' +
      'Veuillez réessayer ou contacter support@applyflow.ch'
    );
  }
}
