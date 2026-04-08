const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /analytics
router.get('/', async (req, res) => {
    try {
        // Total files
        const { count: totalFiles } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true });

        // Total downloads
        const { count: totalDownloads } = await supabase
            .from('downloads')
            .select('*', { count: 'exact', head: true });

        // Most accessed file: group downloads by file_id and get file with max downloads
        const { data: downloads } = await supabase.from('downloads').select('file_id');

        let mostAccessed = null;
        if (downloads && downloads.length > 0) {
            const countMap = {};
            downloads.forEach((d) => {
                countMap[d.file_id] = (countMap[d.file_id] || 0) + 1;
            });
            const topFileId = Object.keys(countMap).reduce((a, b) =>
                countMap[a] > countMap[b] ? a : b
            );
            const { data: topFile } = await supabase
                .from('files')
                .select('pdf_id, file_url')
                .eq('id', topFileId)
                .single();
            mostAccessed = topFile
                ? { pdf_id: topFile.pdf_id, downloads: countMap[topFileId] }
                : null;
        }

        // Recent uploads (last 5)
        const { data: recentUploads } = await supabase
            .from('files')
            .select('pdf_id, created_at, expires_at')
            .order('created_at', { ascending: false })
            .limit(5);

        // Chart Data (Group by Date)
        const { data: allFiles } = await supabase.from('files').select('created_at, file_size');
        const groupedData = {};
        (allFiles || []).forEach(f => {
            const date = new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!groupedData[date]) groupedData[date] = { date, uploads: 0, storageMB: 0 };
            groupedData[date].uploads += 1;
            groupedData[date].storageMB += (f.file_size || 0) / (1024 * 1024);
        });
        // Sort by actual date slightly roughly, or just rely on insertion order if short time span
        const chartData = Object.values(groupedData);

        return res.status(200).json({
            totalFiles: totalFiles || 0,
            totalDownloads: totalDownloads || 0,
            mostAccessed,
            recentUploads: recentUploads || [],
            chartData
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
