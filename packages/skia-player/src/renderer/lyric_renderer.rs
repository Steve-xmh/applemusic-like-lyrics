use skia_safe::{
    textlayout::{
        FontCollection, Paragraph, ParagraphBuilder, ParagraphStyle, TextStyle,
        TypefaceFontProvider,
    },
    Canvas, Color4f, Font, FontMgr, Paint, Point, Rect, Size, TextBlob, Typeface,
};
use tracing::*;

#[derive(Debug)]
struct LyricLineElement {
    pub line: ws_protocol::LyricLine,
    pub size: Size,
    pub paragraph: Option<Paragraph>,
    pub sub_paragraph: Option<Paragraph>,
}

impl LyricLineElement {
    pub fn is_visible(&self, region: &Rect, point: &Point) -> bool {
        let rect = Rect::from_xywh(point.x, point.y, self.size.width, self.size.height);
        region.intersects(rect)
    }
}

#[derive(Debug)]
pub struct LyricRenderer {
    pingfang_type_face: Typeface,
    sf_pro_type_face: Typeface,
    progress: f64,
    rect: Rect,
    lines: Vec<LyricLineElement>,
}

impl LyricRenderer {
    pub fn new(pingfang_type_face: Typeface, sf_pro_type_face: Typeface) -> Self {
        Self {
            pingfang_type_face,
            sf_pro_type_face,
            progress: 0.,
            rect: Rect::new_empty(),
            lines: Vec::with_capacity(1024),
        }
    }

    pub fn set_progress(&mut self, progress: f64) {
        self.progress = progress;
    }

    pub fn set_lines(&mut self, lines: Vec<ws_protocol::LyricLine>) {
        self.lines.clear();
        for line in lines {
            self.lines.push(LyricLineElement {
                line,
                size: Size::new_empty(),
                paragraph: None,
                sub_paragraph: None,
            });
        }
        self.layout();
    }

    fn draw_debug_text(&self, canvas: &Canvas, text: &str, pos: Point) {
        let mut param_style = ParagraphStyle::new();
        param_style.set_text_style(
            TextStyle::new()
                .set_font_size(16.)
                .set_foreground_paint(&Paint::new(Color4f::new(1.0, 0.0, 0.0, 1.0), None)),
        );
        let mut font_collection = FontCollection::new();
        let font_mgr = FontMgr::new();
        font_collection
            .set_default_font_manager_and_family_names(font_mgr, &["SF Pro", "PingFang SC"]);
        let mut param = ParagraphBuilder::new(&param_style, font_collection);
        param.add_text(text);
        let mut paragraph = param.build();
        paragraph.layout(self.rect.width());
        paragraph.paint(canvas, pos);
    }

    pub fn render(&mut self, canvas: &Canvas) {
        canvas.save();

        let mut point = Point::new(self.rect.left, self.rect.top + self.rect.height() / 2.0);
        if let Some((i, first_active_line)) = self.lines.iter().enumerate().rev().find(|x| {
            let start_time = x.1.line.words.first().map(|x| x.start_time);
            if let Some(start_time) = start_time {
                start_time <= self.progress as u32
            } else {
                false
            }
        }) {
            point.y -= self
                .lines
                .iter()
                .take(i)
                .map(|x| x.size.height + self.rect.height() * 0.05)
                .sum::<f32>();
            point.y -= (first_active_line.size.height + self.rect.height() * 0.05) / 2.0;
        }
        for line in &self.lines {
            if !line.is_visible(&self.rect, &point) {
                point.y += self.rect.height() * 0.05;
                if let Some(param) = &line.paragraph {
                    point.y += param.height();
                }
                if let Some(param) = &line.sub_paragraph {
                    point.y += param.height();
                }
                continue;
            }
            // self.draw_debug_text(canvas, &format!("{line:#?}"), point);
            point.y += self.rect.height() * 0.025;
            if let Some(param) = &line.paragraph {
                param.paint(canvas, point);
                canvas.draw_rect(
                    Rect::from_xywh(point.x, point.y, param.max_width(), param.height()),
                    Paint::new(Color4f::new(1., 0., 0., 0.), None)
                        .set_stroke(true)
                        .set_stroke_width(1.),
                );
                point.y += param.height();
            }
            if let Some(param) = &line.sub_paragraph {
                param.paint(canvas, point);
                canvas.draw_rect(
                    Rect::from_xywh(point.x, point.y, param.max_width(), param.height()),
                    Paint::new(Color4f::new(0., 1., 0., 0.), None)
                        .set_stroke(true)
                        .set_stroke_width(1.),
                );
                point.y += param.height();
            }
            point.y += self.rect.height() * 0.025;
        }
        canvas.restore();
    }

    pub fn set_rect(&mut self, rect: Rect) {
        self.rect = rect;
        self.layout();
    }

    pub fn layout(&mut self) {
        let width = self.rect.width();
        let mut font_collection = FontCollection::new();
        let font_mgr = FontMgr::new();
        font_collection
            .set_default_font_manager_and_family_names(font_mgr, &["SF Pro", "PingFang SC"]);
        let mut param_style = ParagraphStyle::new();
        param_style.set_text_style(
            TextStyle::new()
                .set_font_size(self.rect.height() * 0.05)
                .set_foreground_paint(
                    Paint::new(Color4f::new(1.0, 1.0, 1.0, 0.8), None)
                        .set_blend_mode(skia_safe::BlendMode::Plus),
                ),
        );
        let mut sub_param_style = ParagraphStyle::new();
        sub_param_style.set_text_style(
            TextStyle::new()
                .set_font_size(self.rect.height() * 0.025)
                .set_foreground_paint(
                    Paint::new(Color4f::new(1.0, 1.0, 1.0, 0.5), None)
                        .set_blend_mode(skia_safe::BlendMode::Plus),
                ),
        );
        let mut tf_provider = TypefaceFontProvider::new();
        tf_provider.register_typeface(
            self.pingfang_type_face.clone(),
            Some(self.pingfang_type_face.family_name()),
        );
        tf_provider.register_typeface(
            self.sf_pro_type_face.clone(),
            Some(self.sf_pro_type_face.family_name()),
        );
        font_collection.set_asset_font_manager(Some(tf_provider.into()));
        for line in &mut self.lines {
            let mut param = ParagraphBuilder::new(&param_style, font_collection.clone());
            for word in &line.line.words {
                // TODO: 增加颜色样式等
                param.add_text(&word.word);
            }
            let mut paragraph = param.build();
            paragraph.layout(width);
            line.size = Size::new(width, paragraph.height());
            line.paragraph = Some(paragraph);
            let sub_line = line.line.translated_lyric.as_ref().to_string()
                + "\n"
                + line.line.roman_lyric.as_ref();
            if sub_line.trim().is_empty() {
                line.sub_paragraph = None;
            } else {
                let mut param = ParagraphBuilder::new(&sub_param_style, font_collection.clone());
                param.add_text(sub_line.trim());
                let mut paragraph = param.build();
                paragraph.layout(width);
                line.size.height += paragraph.height();
                line.sub_paragraph = Some(paragraph);
            }
            // debug!("Layouted line: {:?}", line);
        }
    }
}
