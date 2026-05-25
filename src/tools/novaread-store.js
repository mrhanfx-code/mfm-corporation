// MFM Corporation × Novaread Empire — D1 Data Store
// Handles all database operations for ebook sales, leads, content tracking
// Database: Cloudflare D1 (SQLite)

// ============================================================
// LEAD MANAGEMENT
// ============================================================

export async function createLead({ source, sourceDetail, contactMethod, contactId, leadName, notes, tags }, env) {
    if (!env.DB) throw new Error('D1 database not configured');
    const result = await env.DB.prepare(
        `INSERT INTO novaread_leads (source, source_detail, contact_method, contact_id, lead_name, notes, tags, first_contact_at, last_contact_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(source, sourceDetail || '', contactMethod, contactId, leadName || '', notes || '', tags || '').run();
    return { id: result.meta.last_row_id, status: 'new' };
}

export async function getLeadByContact(contactId, env) {
    if (!env.DB) return null;
    return await env.DB.prepare(
        `SELECT * FROM novaread_leads WHERE contact_id = ? ORDER BY first_contact_at DESC LIMIT 1`
    ).bind(contactId).first();
}

export async function updateLeadStatus(leadId, status, notes, env) {
    if (!env.DB) throw new Error('D1 database not configured');
    await env.DB.prepare(
        `UPDATE novaread_leads SET status = ?, notes = COALESCE(notes || '\n' || ?, ?), last_contact_at = datetime('now') WHERE id = ?`
    ).bind(status, notes || '', notes || '', leadId).run();
    return { updated: true };
}

export async function getLeadsByStatus(status, limit = 50, env) {
    if (!env.DB) return [];
    const stmt = status === 'all'
        ? `SELECT * FROM novaread_leads ORDER BY last_contact_at DESC LIMIT ?`
        : `SELECT * FROM novaread_leads WHERE status = ? ORDER BY last_contact_at DESC LIMIT ?`;
    const query = status === 'all'
        ? env.DB.prepare(stmt).bind(limit)
        : env.DB.prepare(stmt).bind(status, limit);
    return (await query.all()).results || [];
}

export async function getLeadStats(env) {
    if (!env.DB) return {};
    const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM novaread_leads`).first();
    const byStatus = await env.DB.prepare(`SELECT status, COUNT(*) as count FROM novaread_leads GROUP BY status`).all();
    const today = await env.DB.prepare(`SELECT COUNT(*) as count FROM novaread_leads WHERE DATE(first_contact_at) = DATE('now')`).first();
    return { total: total.count, byStatus: byStatus.results || [], today: today.count };
}

// ============================================================
// SALES MANAGEMENT
// ============================================================

export async function createSale({ leadId, package: pkg, amountRm, paymentMethod, paymentReference, channel, ebookPdfUrl, ebookEpubUrl, templatesUrl }, env) {
    if (!env.DB) throw new Error('D1 database not configured');
    const orderCode = `NOV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    const result = await env.DB.prepare(
        `INSERT INTO novaread_sales (lead_id, order_code, package, amount_rm, payment_method, payment_reference, channel, ebook_pdf_url, ebook_epub_url, templates_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(leadId, orderCode, pkg, amountRm, paymentMethod, paymentReference || '', channel, ebookPdfUrl || '', ebookEpubUrl || '', templatesUrl || '').run();
    return { id: result.meta.last_row_id, orderCode };
}

export async function verifyPayment(saleId, env) {
    if (!env.DB) return;
    await env.DB.prepare(
        `UPDATE novaread_sales SET payment_verified = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(saleId).run();
}

export async function markDelivered(saleId, deliveryMethod, env) {
    if (!env.DB) return;
    await env.DB.prepare(
        `UPDATE novaread_sales SET delivered_at = datetime('now'), delivery_method = ? WHERE id = ?`
    ).bind(deliveryMethod, saleId).run();
}

export async function getSaleByOrderCode(orderCode, env) {
    if (!env.DB) return null;
    return await env.DB.prepare(`SELECT * FROM novaread_sales WHERE order_code = ?`).bind(orderCode).first();
}

export async function getSalesSummary(days = 14, env) {
    if (!env.DB) return { totalSales: 0, totalRevenue: 0, avgOrderValue: 0 };
    const result = await env.DB.prepare(
        `SELECT COUNT(*) as total_sales, SUM(amount_rm) as total_revenue, AVG(amount_rm) as avg_order_value
         FROM novaread_sales WHERE payment_verified = 1 AND created_at >= datetime('now', '-${days} days')`
    ).first();
    return {
        totalSales: result.total_sales || 0,
        totalRevenue: result.total_revenue || 0,
        avgOrderValue: result.avg_order_value || 0
    };
}

export async function getSalesByChannel(days = 14, env) {
    if (!env.DB) return [];
    return (await env.DB.prepare(
        `SELECT channel, COUNT(*) as sales, SUM(amount_rm) as revenue FROM novaread_sales
         WHERE payment_verified = 1 AND created_at >= datetime('now', '-${days} days')
         GROUP BY channel ORDER BY revenue DESC`
    ).all()).results || [];
}

export async function getDailySales(env) {
    if (!env.DB) return [];
    return (await env.DB.prepare(
        `SELECT DATE(created_at) as date, COUNT(*) as sales, SUM(amount_rm) as revenue
         FROM novaread_sales WHERE payment_verified = 1
         GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
    ).all()).results || [];
}

// ============================================================
// CONTENT PERFORMANCE TRACKING
// ============================================================

export async function createContent({ platform, contentType, agentCreator, contentTitle, contentBody, qualityScore, reviewerAgent, abTestVariant, tags }, env) {
    if (!env.DB) throw new Error('D1 database not configured');
    const result = await env.DB.prepare(
        `INSERT INTO novaread_content (platform, content_type, agent_creator, content_title, content_body, quality_score, reviewer_agent, ab_test_variant, tags, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'))`
    ).bind(platform, contentType, agentCreator, contentTitle, contentBody, qualityScore || null, reviewerAgent || null, abTestVariant || null, tags || '').run();
    return { id: result.meta.last_row_id };
}

export async function markContentPosted(contentId, env) {
    if (!env.DB) return;
    await env.DB.prepare(
        `UPDATE novaread_content SET status = 'posted', posted_at = datetime('now') WHERE id = ?`
    ).bind(contentId).run();
}

export async function updateContentEngagement(contentId, { likes, comments, shares, views, leads, sales, revenue }, env) {
    if (!env.DB) return;
    await env.DB.prepare(
        `UPDATE novaread_content SET
         engagement_likes = engagement_likes + ?,
         engagement_comments = engagement_comments + ?,
         engagement_shares = engagement_shares + ?,
         engagement_views = engagement_views + ?,
         leads_generated = leads_generated + ?,
         sales_attributed = sales_attributed + ?,
         revenue_attributed = revenue_attributed + ?
         WHERE id = ?`
    ).bind(likes || 0, comments || 0, shares || 0, views || 0, leads || 0, sales || 0, revenue || 0, contentId).run();
}

export async function getTopContent(limit = 10, env) {
    if (!env.DB) return [];
    return (await env.DB.prepare(
        `SELECT * FROM novaread_content WHERE status = 'posted' ORDER BY revenue_attributed DESC, leads_generated DESC LIMIT ?`
    ).bind(limit).all()).results || [];
}

// ============================================================
// DAILY KPI
// ============================================================

export async function upsertDailyKpi(date, data, env) {
    if (!env.DB) return;
    const existing = await env.DB.prepare(`SELECT * FROM novaread_daily_kpi WHERE date = ?`).bind(date).first();
    if (existing) {
        await env.DB.prepare(
            `UPDATE novaread_daily_kpi SET
             leads_new = leads_new + ?, leads_contacted = leads_contacted + ?,
             sales_count = sales_count + ?, revenue_rm = revenue_rm + ?,
             content_posted = content_posted + ?, notes = ?
             WHERE date = ?`
        ).bind(data.leadsNew || 0, data.leadsContacted || 0, data.salesCount || 0, data.revenueRm || 0, data.contentPosted || 0, data.notes || existing.notes, date).run();
    } else {
        await env.DB.prepare(
            `INSERT INTO novaread_daily_kpi (date, leads_new, leads_contacted, sales_count, revenue_rm, content_posted, avg_response_time_minutes, top_channel, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(date, data.leadsNew || 0, data.leadsContacted || 0, data.salesCount || 0, data.revenueRm || 0, data.contentPosted || 0, data.avgResponseTime || null, data.topChannel || null, data.notes || '').run();
    }
}

export async function getKpiReport(days = 14, env) {
    if (!env.DB) return [];
    return (await env.DB.prepare(
        `SELECT * FROM novaread_daily_kpi WHERE date >= DATE('now', '-${days} days') ORDER BY date DESC`
    ).all()).results || [];
}

// ============================================================
// CEO DASHBOARD QUERIES
// ============================================================

export async function getNovareadDashboard(env) {
    const [leadStats, salesSummary, salesByChannel, dailySales, topContent] = await Promise.all([
        getLeadStats(env),
        getSalesSummary(14, env),
        getSalesByChannel(14, env),
        getDailySales(env),
        getTopContent(5, env)
    ]);

    return {
        leads: leadStats,
        sales: salesSummary,
        byChannel: salesByChannel,
        daily: dailySales,
        topContent: topContent,
        generatedAt: new Date().toISOString()
    };
}

export async function getNovareadStatusMessage(env) {
    const dashboard = await getNovareadDashboard(env);
    const today = new Date().toISOString().slice(0, 10);
    const todayKpi = dashboard.daily.find(d => d.date === today);

    return `📚 *Novaread Empire — 14-Day Sprint Status*

📊 *Sales (14 days)*
• Total Revenue: RM ${dashboard.sales.totalRevenue?.toFixed(2) || '0.00'}
• Sales Count: ${dashboard.sales.totalSales || 0}
• Avg Order: RM ${dashboard.sales.avgOrderValue?.toFixed(2) || '0.00'}

👥 *Leads*
• Total Leads: ${dashboard.leads.total || 0}
• New Today: ${dashboard.leads.today || 0}

🏆 *Top Channel*
${dashboard.byChannel.map(c => `• ${c.channel}: ${c.sales} sales (RM ${c.revenue?.toFixed(2)})`).join('\n') || 'No sales yet'}

📈 *Today (${today})*
${todayKpi ? `• Sales: ${todayKpi.sales_count} | Revenue: RM ${todayKpi.revenue_rm} | Content: ${todayKpi.content_posted}` : 'No data yet'}

*Top Content:*
${dashboard.topContent.slice(0, 3).map(c => `• ${c.platform} — ${c.sales_attributed} sales (score: ${c.quality_score})`).join('\n') || 'No content posted yet'}
`;
}
