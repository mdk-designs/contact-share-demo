import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { lead_id, profile_id, visitor_name, visitor_email, visitor_phone, visitor_company, notes } = body;

    let profile: any = null;
    let lead: any = null;

    // 1. If Supabase DB is connected and lead_id provided, fetch from DB
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && lead_id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: dbLead, error: leadErr } = await supabase
        .from("leads")
        .select("*, profiles(*)")
        .eq("id", lead_id)
        .single();

      if (!leadErr && dbLead) {
        lead = dbLead;
        profile = dbLead.profiles;
      }
    }

    // 2. Fallback to direct payload if lead or profile not loaded from DB
    if (!profile && profile_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile_id)
        .single();
      profile = dbProfile;
    }

    // If still missing profile, use provided mock fallback
    if (!profile) {
      profile = {
        first_name: "Deepak",
        last_name: "Kumar",
        job_title: "UI/UX Engineer & Product Designer",
        company_name: "DesignForge Studio",
        work_email: "deepak@designforge.studio",
        mobile_phone: "+919876543210",
        website_url: "https://deepak.design",
        address: "Bengaluru, India",
        bio: "UI/UX Engineer & Product Designer at DesignForge Studio.",
      };
    }

    const targetVisitorName = visitor_name || lead?.visitor_name || lead?.name || "Friend";
    const targetVisitorEmail = visitor_email || lead?.visitor_email || lead?.email;
    const targetVisitorPhone = visitor_phone || lead?.visitor_phone || lead?.phone || "";
    const targetVisitorCompany = visitor_company || lead?.visitor_company || lead?.organization || "";
    const targetNotes = notes || lead?.notes || "";

    const fullName = `${profile.first_name} ${profile.last_name}`.trim();
    const filename = `${profile.first_name}_${profile.last_name}.vcf`.replace(/\s+/g, "_");

    // 3. Compile RFC 6350 vCard content with CRLF
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${profile.last_name || ""};${profile.first_name || ""};;;`,
      `FN:${fullName}`,
      profile.company_name ? `ORG:${profile.company_name}` : "",
      profile.job_title ? `TITLE:${profile.job_title}` : "",
      `EMAIL;TYPE=INTERNET,WORK:${profile.work_email}`,
      profile.mobile_phone ? `TEL;TYPE=CELL,VOICE:${profile.mobile_phone}` : "",
      profile.work_phone ? `TEL;TYPE=WORK,VOICE:${profile.work_phone}` : "",
      profile.website_url ? `URL:${profile.website_url}` : "",
      profile.address ? `ADR;TYPE=WORK:;;${profile.address};;;;` : "",
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, "\\n")}` : "",
      `REV:${new Date().toISOString()}`,
      "END:VCARD",
    ].filter(Boolean);

    const vcardString = vcardLines.join("\r\n");
    const vcardBase64 = btoa(unescape(encodeURIComponent(vcardString)));

    let visitorSent = false;
    let ownerSent = false;

    // 4. Dispatch through Resend API
    if (RESEND_API_KEY) {
      // 4a. Visitor Email with vCard Attachment
      if (targetVisitorEmail) {
        const visitorHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #0f172a; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${fullName}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${[profile.job_title, profile.company_name].filter(Boolean).join(" • ")}</p>
            </div>
            <div style="padding: 24px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">Hi <strong>${targetVisitorName}</strong>,</p>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.5; color: #475569;">
                Thank you for exchanging contact info! As requested, the complete digital contact card for <strong>${fullName}</strong> is attached to this email (<strong>${filename}</strong>).
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 3px 0; font-size: 13px;"><strong>Phone:</strong> ${profile.mobile_phone || profile.work_phone || "—"}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Email:</strong> ${profile.work_email}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Company:</strong> ${profile.company_name || "—"}</p>
              </div>
              <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 12px 14px; text-align: center; font-size: 12px; color: #3730a3;">
                📥 <strong>How to save:</strong> Tap the attached <strong>${filename}</strong> file to save this contact directly to your phone's contacts.
              </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
              Powered by ContactForge Digital Business Cards
            </div>
          </div>
        `;

        const resVisitor = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `"${fullName} (via ContactForge)" <onboarding@resend.dev>`,
            to: [targetVisitorEmail],
            subject: `Saved Contact: ${fullName} (${profile.company_name || "Contact Card"})`,
            html: visitorHtml,
            attachments: [
              {
                filename,
                content: vcardBase64,
              },
            ],
          }),
        });

        if (resVisitor.ok) visitorSent = true;
      }

      // 4b. Card Owner Notification
      if (profile.work_email && profile.work_email !== targetVisitorEmail) {
        const alertHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; color: #0f172a; padding: 20px;">
            <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 18px;">⚡ New Contact Exchange Received</h2>
            </div>
            <div style="padding: 16px 0;">
              <p>Hi ${profile.first_name}, <strong>${targetVisitorName}</strong> just saved your contact card and shared their details:</p>
              <ul>
                <li><strong>Phone:</strong> ${targetVisitorPhone || "—"}</li>
                <li><strong>Email:</strong> ${targetVisitorEmail || "—"}</li>
                <li><strong>Company:</strong> ${targetVisitorCompany || "—"}</li>
                <li><strong>Notes:</strong> ${targetNotes || "None"}</li>
              </ul>
            </div>
          </div>
        `;

        const resAlert = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `"ContactForge Alert" <onboarding@resend.dev>`,
            to: [profile.work_email],
            subject: `⚡ New Lead: ${targetVisitorName}`,
            html: alertHtml,
          }),
        });

        if (resAlert.ok) ownerSent = true;
      }

      // 4c. Update Supabase leads table if lead_id exists
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && lead_id && visitorSent) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("leads")
          .update({ vcard_emailed: true, vcard_emailed_at: new Date().toISOString() })
          .eq("id", lead_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        visitorEmailed: visitorSent,
        ownerAlerted: ownerSent,
        message: RESEND_API_KEY ? "Email process completed via Resend" : "Simulation mode (no RESEND_API_KEY set)",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to process vcard email" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
