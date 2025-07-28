import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import pkg from "@shopify/polaris";
const {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Tabs,
  ColorPicker,
  Checkbox,
  Select,
  Stack,
  ButtonGroup,
  Modal,
  TextContainer
} = pkg;
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  
  try {
    const config = await prisma.appConfig.findUnique({
      where: { shop: session.shop }
    });

    if (config) {
      return json({ config: JSON.parse(config.configuration) });
    }

    return json({ config: null });
  } catch (error) {
    console.error("Error loading config:", error);
    return json({ config: null });
  }
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const configData = formData.get("config");

  try {
    const config = JSON.parse(configData);
    
    await prisma.appConfig.upsert({
      where: { shop: session.shop },
      update: {
        configuration: JSON.stringify(config),
        updatedAt: new Date()
      },
      create: {
        shop: session.shop,
        configuration: JSON.stringify(config),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return json({ success: true, message: "Configuration saved successfully!" });
  } catch (error) {
    console.error("Error saving config:", error);
    return json({ 
      success: false, 
      message: "Failed to save configuration. Please try again." 
    });
  }
}

export default function LiveRenderingAdmin() {
  const { config: initialConfig } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [config, setConfig] = useState(initialConfig || getDefaultConfig());
  const [selectedTab, setSelectedTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [previewModalActive, setPreviewModalActive] = useState(false);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  const updateConfig = useCallback((section, updates) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  }, []);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("config", JSON.stringify(config));
    submit(formData, { method: "post" });
    setIsSaving(false);
  }, [config, submit]);

  const tabs = [
    { id: "announcement", content: "Announcement Bar" },
    { id: "header", content: "Header" },
    { id: "slider", content: "Hero Slider" },
    { id: "categories", content: "Categories" },
  ];

  return (
    <Page
      title="Live Rendering Configuration"
      subtitle="Configure your mobile app appearance and content in real-time"
      primaryAction={{
        content: "Save Configuration",
        onAction: handleSave,
        loading: isSaving
      }}
    >
      {actionData?.message && (
        <Banner 
          status={actionData.success ? "success" : "critical"}
          onDismiss={() => {}}
        >
          {actionData.message}
        </Banner>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Card.Section>
                <div style={{ padding: '20px' }}>
                  <h3>Configuration Panel</h3>
                  <p>Live rendering configuration will be available here.</p>
                  <p>Currently in development mode.</p>
                </div>
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function getDefaultConfig() {
  return {
    announcementBar: {
      enabled: true,
      text: "🎉 Welcome to our store! Free shipping on orders over $50!",
      backgroundColor: "#2563EB",
      textColor: "#FFFFFF",
      fontSize: 14,
      isScrolling: false,
      height: 40
    },
    header: {
      showLogo: true,
      logoUrl: "",
      title: "Eyejack",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      showSearch: true,
      showCart: true
    }
  };
} 