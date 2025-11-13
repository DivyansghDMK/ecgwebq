import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const adminFeatures = [
  {
    title: "Role-based access",
    description:
      "Assign granular permissions to Admin and Standard roles, govern report exports, and manage device enrollment across clinics.",
    bullets: [
      "Link clinicians to patient cohorts with one click",
      "Tie reports to user accounts automatically",
      "Propagate changes to local + cloud directories"
    ]
  },
  {
    title: "Cloud + local user management",
    description:
      "Sync your workforce between on-premises appliances and CardioX Cloud. Offline edits queue safely for later transmission.",
    bullets: [
      "Local storage fallback for remote deployments",
      "Cloud cleanup ensures revoked access is instant",
      "Detailed audit log exported to JSON or CSV"
    ]
  }
];

export function AdminSection() {
  return (
    <section id="admin" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="uppercase tracking-[0.4em]">Admin Control Panel</Badge>
          <h2 className="section-heading">
            Govern every user, report, and device from a single pane
          </h2>
          <p className="section-subheading">
            CardioX keeps patient data and workforce access synchronized. Link users to
            reports, remove devices, and trigger automated clean-up tasks across local and
            cloud environments.
          </p>
        </div>
        <Badge variant="neutral" className="uppercase tracking-[0.4em]">
          Zero downtime provisioning
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <motion.div
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Admin Panel • User overview
          </p>
          <div className="mt-4 h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
            <img
              src="/assets/admin-panel.jpg"
              alt="CardioX admin control panel interface"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Linked reports
              </p>
              <p className="mt-2 font-display text-2xl text-white">5,326</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Active clinicians
              </p>
              <p className="mt-2 font-display text-2xl text-white">268</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Cloud sync queue
              </p>
              <p className="mt-2 font-display text-2xl text-white">8</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {adminFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/70">
                  {feature.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
                {index === 1 ? (
                  <CardFooter className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Offline edits sync automatically when connectivity returns
                  </CardFooter>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

